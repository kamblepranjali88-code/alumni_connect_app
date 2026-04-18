// js/verify-alumni.js

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

async function loadPending() {
    const { data, error } = await supabase
        .from('alumni')
        .select('*')
        .eq('is_verified', false);

    const container = document.getElementById('pendingList');
    if (error || !data.length) {
        container.innerHTML = '<p style="color:#9ca3af;text-align:center">No pending requests</p>';
        return;
    }

    container.innerHTML = data.map(a => `
        <div class="alumni-card">
            <div class="alumni-info">
                <h4>${a.name}</h4>
                <p>${a.email} &bull; ${a.branch || ''} &bull; Batch ${a.batch || ''}</p>
            </div>
            <div class="alumni-actions">
                <button class="btn-approve" onclick="approve('${a.id}')">
                    <i class="fas fa-check"></i> Approve
                </button>
                <button class="btn-reject" onclick="reject('${a.id}')">
                    <i class="fas fa-times"></i> Reject
                </button>
            </div>
        </div>
    `).join('');
}

async function loadVerified() {
    const { data, error } = await supabase
        .from('alumni')
        .select('*')
        .eq('is_verified', true);

    const container = document.getElementById('verifiedList');
    if (error || !data.length) {
        container.innerHTML = '<p style="color:#9ca3af;text-align:center">No verified alumni yet</p>';
        return;
    }

    container.innerHTML = data.map(a => `
        <div class="alumni-card">
            <div class="alumni-info">
                <h4>${a.name}</h4>
                <p>${a.email} &bull; ${a.branch || ''} &bull; Batch ${a.batch || ''}</p>
            </div>
            <span class="badge-verified"><i class="fas fa-check-circle"></i> Verified</span>
        </div>
    `).join('');
}

window.approve = async function(id) {
    const { error } = await supabase
        .from('alumni')
        .update({ is_verified: true })
        .eq('id', id);
    if (!error) { showToast('Alumni approved!'); loadPending(); loadVerified(); }
};

window.reject = async function(id) {
    const { error } = await supabase
        .from('alumni')
        .delete()
        .eq('id', id);
    if (!error) { showToast('Request rejected.'); loadPending(); }
};

loadPending();
loadVerified();