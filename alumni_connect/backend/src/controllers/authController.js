// Student Authentication Controller
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

// Generate UserID
const generateUserId = (rollNumber) => {
    return 'STU_' + rollNumber;
};

// ===== STUDENT REGISTRATION =====
const studentRegistration = async (req, res) => {
    try {
        console.log('=== REGISTRATION ATTEMPT ===');
        console.log('1. Form data received:', req.body);

        const { fullName, rollNumber, email, branch, year, interests } = req.body;

        // Validate required fields
        if (!fullName || !rollNumber || !email || !branch || !year) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const normalizedRoll  = rollNumber?.trim();
        const normalizedEmail = email?.trim().toLowerCase();

        console.log('2. Normalized values:');
        console.log('   - rollNumber:', normalizedRoll);
        console.log('   - email:', normalizedEmail);

        // 1. Verify student from COLLEGE DB
        console.log('3. Querying college_students in College DB...');
        const { data: collegeStudent, error: collegeError } = await collegeDB
            .from('college_students')
            .select('*')
            .eq('roll_number', normalizedRoll)
            .eq('email', normalizedEmail)
            .maybeSingle();

        console.log('4. Query result:', collegeStudent);
        console.log('5. Full collegeError:', JSON.stringify(collegeError, null, 2));

        if (collegeError) {
            return res.status(500).json({
                message: 'Database error while verifying student records',
                detail: collegeError.message
            });
        }

        if (!collegeStudent) {
            return res.status(404).json({
                message: 'Roll number or email not found in college records'
            });
        }

        console.log('7. ✅ Match found in College DB');

        // 2. Check if already registered
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('roll_number', normalizedRoll)
            .maybeSingle();

        if (existingUser) {
            return res.status(400).json({ message: 'This student is already registered' });
        }

        // 3. Generate credentials
        const tempPassword   = generatePassword();
        const userId         = generateUserId(normalizedRoll);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // 4. Create user in APP DB
        const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert([{
                roll_number:   normalizedRoll,
                password_hash: hashedPassword,
                user_type:     'student',
                login_count:   0
            }])
            .select()
            .single();

        if (userError) {
            console.error('❌ Error creating user:', userError.message);
            return res.status(500).json({ message: 'Error creating user account' });
        }

        // 5. Create student profile
        const { error: studentError } = await supabase
            .from('students')
            .insert([{
                user_id:     newUser.user_id,
                roll_number: normalizedRoll,
                full_name:   fullName?.trim(),
                email:       normalizedEmail,
                branch:      branch?.trim(),
                year:        parseInt(year),
                interests:   interests || []
            }]);

        if (studentError) {
            console.error('❌ Error creating student profile:', studentError.message);
            return res.status(500).json({ message: 'Error creating student profile' });
        }

        // 6. Send email
        await sendCredentials(normalizedEmail, userId, tempPassword, fullName?.trim());

        console.log('8. ✅ Registration successful for:', normalizedEmail);
        res.status(200).json({
            message: 'Registration successful! Check your email for credentials.'
        });

    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// ===== LOGIN =====
// ===== LOGIN =====
const login = async (req, res) => {
    try {
        const { userId, password } = req.body;

        console.log('=== LOGIN ATTEMPT ===');
        console.log('Received userId:', userId);

        const rollNumber = userId?.replace('STU_', '').trim();
        console.log('Extracted rollNumber:', rollNumber);

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('roll_number', rollNumber)
            .maybeSingle();

        console.log('User found:', user ? 'YES' : 'NO');

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

        // ✅ FIRST: Get student_id from students table
        const { data: student, error: studentError } = await supabase
            .from('students')
            .select('student_id')
            .eq('user_id', user.user_id)
            .single();

        if (studentError) {
            console.error('❌ Error fetching student_id:', studentError.message);
        }

        console.log('✅ Login successful for:', rollNumber);
        console.log('student_id:', student?.student_id);

        // ✅ THEN: Send response with student_id
        res.json({
            user_id: user.user_id,
            student_id: student?.student_id || null,
            user_type: user.user_type,
            login_count: user.login_count
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// ===== CHANGE PASSWORD =====
const changePassword = async (req, res) => {
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

        console.log('✅ Password changed for user_id:', user_id);
        res.json({ message: 'Password changed successfully' });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ===== GET STUDENT PROFILE =====
const getStudentProfile = async (req, res) => {
    try {
        const { userId } = req.params;

        const { data: student, error } = await supabase
            .from('students')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error || !student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json(student);
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ===== UPDATE STUDENT PROFILE =====
const updateStudentProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const {
            full_name, email, branch, year,
            interests, goals, linkedin, github,
            profile_photo
        } = req.body;

        console.log('📝 Updating profile for user_id:', userId);

        const { data: existingStudent, error: checkError } = await supabase
            .from('students')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (checkError || !existingStudent) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const updateData = {
            full_name,
            email,
            branch,
            year,
            interests: interests || []
        };

        if (goals         !== undefined) updateData.goals         = goals;
        if (linkedin      !== undefined) updateData.linkedin      = linkedin;
        if (github        !== undefined) updateData.github        = github;
        if (profile_photo !== undefined) updateData.profile_photo = profile_photo;

        const { data, error } = await supabase
            .from('students')
            .update(updateData)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            console.error('❌ Error updating student:', error);
            return res.status(500).json({
                message: 'Error updating profile',
                error: error.message
            });
        }

        console.log('✅ Profile updated successfully');
        res.json({
            message: 'Profile updated successfully',
            student: data
        });

    } catch (error) {
        console.error('❌ Update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    studentRegistration,
    login,
    changePassword,
    getStudentProfile,
    updateStudentProfile
};