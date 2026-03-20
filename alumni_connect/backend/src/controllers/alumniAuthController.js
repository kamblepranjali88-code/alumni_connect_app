// Alumni Authentication Controller
const { supabase, collegeDB } = require('../config/supabase');
const bcrypt = require('bcryptjs');
const { sendCredentials } = require('../utils/emailService');

// Generate random password
const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return 'Temp@' + password;
};

// Generate Alumni UserID → ALM_ + PRN number
const generateAlumniUserId = (prnNumber) => {
    return 'ALM_' + prnNumber.toUpperCase();
};

// ===== ALUMNI REGISTRATION =====
const alumniRegistration = async (req, res) => {
    try {
        console.log('=== ALUMNI REGISTRATION ATTEMPT ===');
        console.log('1. Form data received:', req.body);

        const { fullName, email, prnNumber, dateOfBirth, graduationYear, branch } = req.body;

        // Validate required fields
        if (!fullName || !email || !prnNumber || !dateOfBirth || !graduationYear || !branch) {
            return res.status(400).json({
                message: 'All fields are required: Full Name, Email, PRN Number, Date of Birth, Graduation Year, Branch'
            });
        }

        const normalizedEmail    = email?.trim().toLowerCase();
        const normalizedPRN      = prnNumber?.trim().toUpperCase();
        const normalizedDOB      = dateOfBirth?.trim();
        const normalizedGradYear = parseInt(graduationYear);

        console.log('2. Normalized values:');
        console.log('   - email:', normalizedEmail);
        console.log('   - prnNumber:', normalizedPRN);
        console.log('   - dateOfBirth:', normalizedDOB);
        console.log('   - graduationYear:', normalizedGradYear);

        // 1. Verify alumni from COLLEGE DB
        console.log('3. Querying college_alumni in College DB...');
        const { data: collegeAlumni, error: collegeError } = await collegeDB
            .from('college_alumni')
            .select('*')
            .eq('prn_number', normalizedPRN)
            .eq('Date_Of_Birth', normalizedDOB)
            .eq('graduation_year', normalizedGradYear)
            .maybeSingle();

        console.log('4. Query result:', collegeAlumni);
        console.log('5. College DB error:', JSON.stringify(collegeError, null, 2));

        if (collegeError) {
            return res.status(500).json({
                message: 'Database error while verifying alumni records',
                detail: collegeError.message
            });
        }

        if (!collegeAlumni) {
            console.log('6. ❌ No match found for PRN:', normalizedPRN);
            return res.status(404).json({
                message: '❌ Verification failed! PRN Number, Date of Birth or Graduation Year does not match college records'
            });
        }

        console.log('7. ✅ Match found in College DB:', collegeAlumni);

        // 2. Check if already registered
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('roll_number', normalizedPRN)
            .maybeSingle();

        if (existingUser) {
            return res.status(400).json({ message: 'This alumni is already registered' });
        }

        // 3. Generate credentials
        const tempPassword   = generatePassword();
        const userId         = generateAlumniUserId(normalizedPRN);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // 4. Create user in APP DB
        const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert([{
                roll_number:   normalizedPRN,
                password_hash: hashedPassword,
                user_type:     'alumni',
                login_count:   0
            }])
            .select()
            .single();

        if (userError) {
            console.error('❌ Error creating user:', userError.message);
            return res.status(500).json({ message: 'Error creating alumni account' });
        }

        // 5. Create alumni profile — only basic fields
        const { error: alumniError } = await supabase
            .from('alumni')
            .insert([{
                user_id:         newUser.user_id,
                full_name:       fullName?.trim(),
                email:           normalizedEmail,
                branch:          collegeAlumni.branch,
                graduation_year: normalizedGradYear
            }]);

        if (alumniError) {
            console.error('❌ Error creating alumni profile:', alumniError.message);
            await supabase.from('users').delete().eq('user_id', newUser.user_id);
            return res.status(500).json({ message: 'Error creating alumni profile: ' + alumniError.message });
        }

        // 6. Send email
        await sendCredentials(normalizedEmail, userId, tempPassword, fullName?.trim());

        console.log('8. ✅ Alumni registration successful for:', normalizedEmail);
        res.status(200).json({
            message: 'Registration successful! Check your email for credentials.'
        });

    } catch (error) {
        console.error('❌ Alumni registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// ===== ALUMNI LOGIN =====
const alumniLogin = async (req, res) => {
    try {
        const { userId, password } = req.body;

        console.log('=== ALUMNI LOGIN ATTEMPT ===');
        console.log('Received userId:', userId);
        console.log('Received password:', password);

        const prnNumber = userId?.replace('ALM_', '').trim();
        console.log('Extracted PRN:', prnNumber);

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('roll_number', prnNumber)
            .eq('user_type', 'alumni')
            .maybeSingle();

        console.log('User found:', user ? 'YES' : 'NO');
        console.log('Stored hash:', user?.password_hash);
        console.log('Entered password:', password);

        if (error) {
            console.error('❌ DB error during login:', error.message);
            return res.status(500).json({ message: 'Database error during login' });
        }

        if (!user) {
            return res.status(401).json({ message: 'Invalid User ID or password' });
        }

        const isValid = await bcrypt.compare(password, user.password_hash);
        console.log('Password valid:', isValid);

        if (!isValid) {
            return res.status(401).json({ message: 'Invalid User ID or password' });
        }

        console.log('✅ Alumni login successful for PRN:', prnNumber);

        res.json({
            user_id:     user.user_id,
            user_type:   user.user_type,
            login_count: user.login_count
        });

    } catch (error) {
        console.error('Alumni login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// ===== CHANGE PASSWORD =====
const alumniChangePassword = async (req, res) => {
    try {
        const { user_id, new_password } = req.body;

        if (!user_id || !new_password) {
            return res.status(400).json({ message: 'user_id and new_password are required' });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);

        const { error } = await supabase
            .from('users')
            .update({
                password_hash: hashedPassword,
                login_count:   1
            })
            .eq('user_id', user_id);

        if (error) {
            console.error('❌ Error changing password:', error.message);
            return res.status(500).json({ message: 'Error changing password' });
        }

        console.log('✅ Password changed for alumni user_id:', user_id);
        res.json({ message: 'Password changed successfully' });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ===== GET ALUMNI PROFILE =====
const getAlumniProfile = async (req, res) => {
    try {
        const { userId } = req.params;

        const { data: alumni, error } = await supabase
            .from('alumni')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error || !alumni) {
            return res.status(404).json({ message: 'Alumni not found' });
        }

        res.json(alumni);
    } catch (error) {
        console.error('Error fetching alumni:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ===== UPDATE ALUMNI PROFILE =====
const updateAlumniProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const {
            full_name, branch, graduation_year,
            company, designation, experience_years,
            industry, bio, skills, mentorship_areas,
            max_mentees, preferred_contact,
            available_for_mentorship,
            linkedin, github, portfolio,
            profile_photo
        } = req.body;

        console.log('📝 Updating alumni profile for user_id:', userId);

        const { data: existingAlumni, error: checkError } = await supabase
            .from('alumni')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (checkError || !existingAlumni) {
            return res.status(404).json({ message: 'Alumni not found' });
        }

        const updateData = {
            full_name,
            branch,
            graduation_year,
            company,
            designation,
            experience_years,
            industry,
            bio,
            skills:                   skills || [],
            mentorship_areas:         mentorship_areas || [],
            max_mentees,
            preferred_contact,
            available_for_mentorship,
            linkedin,
            github,
            portfolio
        };

        if (profile_photo !== undefined) updateData.profile_photo = profile_photo;

        const { data, error } = await supabase
            .from('alumni')
            .update(updateData)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            console.error('❌ Error updating alumni:', error);
            return res.status(500).json({
                message: 'Error updating profile',
                error: error.message
            });
        }

        console.log('✅ Alumni profile updated successfully');
        res.json({
            message: 'Profile updated successfully',
            alumni: data
        });

    } catch (error) {
        console.error('❌ Update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ===== GET ALL ALUMNI (for student search) =====
const getAllAlumni = async (req, res) => {
    try {
        const { branch, company, graduation_year, available_for_mentorship, search } = req.query;

        let query = supabase
            .from('alumni')
            .select('*')
            .eq('is_active', true);

        if (branch)                              query = query.eq('branch', branch);
        if (company)                             query = query.ilike('company', `%${company}%`);
        if (graduation_year)                     query = query.eq('graduation_year', graduation_year);
        if (available_for_mentorship === 'true') query = query.eq('available_for_mentorship', true);
        if (search)                              query = query.ilike('full_name', `%${search}%`);

        const { data: alumniList, error } = await query;

        if (error) {
            console.error('❌ Error fetching alumni list:', error.message);
            return res.status(500).json({ message: 'Error fetching alumni' });
        }

        res.json(alumniList);
    } catch (error) {
        console.error('Error fetching alumni:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    alumniRegistration,
    alumniLogin,
    alumniChangePassword,
    getAlumniProfile,
    updateAlumniProfile,
    getAllAlumni
};