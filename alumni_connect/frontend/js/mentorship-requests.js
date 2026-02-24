let selectedRequestId = null;

let mentorshipRequests = [
    {
        id: 1,
        student: "Amit Kulkarni",
        branch: "CSE",
        year: "Final Year",
        message: "Looking for guidance in backend development",
        status: "pending"
    },
    {
        id: 2,
        student: "Neha Patil",
        branch: "IT",
        year: "Third Year",
        message: "Interested in cloud career guidance",
        status: "pending"
    }
];

const list = document.getElementById("requestsList");
const modal = document.getElementById("rejectModal");

function renderRequests() {
    list.innerHTML = "";

    mentorshipRequests.forEach(req => {
        list.innerHTML += `
            <div class="request-card">
                <div class="request-info">
                    <span class="student-name">${req.student}</span>
                    <span class="student-meta">${req.branch} • ${req.year}</span>
                    <p class="request-message">${req.message}</p>
                    <span class="status ${req.status}">${req.status.toUpperCase()}</span>
                </div>

                <div class="actions">
                    <button class="accept-btn"
                        ${req.status !== "pending" ? "disabled" : ""}
                        onclick="acceptRequest(${req.id})">
                        Accept
                    </button>
                    <button class="reject-btn"
                        ${req.status !== "pending" ? "disabled" : ""}
                        onclick="openRejectModal(${req.id})">
                        Reject
                    </button>
                </div>
            </div>
        `;
    });
}

function acceptRequest(id) {
    const req = mentorshipRequests.find(r => r.id === id);
    req.status = "accepted";
    renderRequests();

    /*
    BACKEND:
    POST /api/mentorship/accept
    */
}

function openRejectModal(id) {
    selectedRequestId = id;
    modal.style.display = "flex";
}

function closeModal() {
    modal.style.display = "none";
    document.getElementById("rejectReason").value = "";
}

function confirmReject() {
    const reason = document.getElementById("rejectReason").value.trim();
    if (!reason) {
        alert("Please provide a reason");
        return;
    }

    const req = mentorshipRequests.find(r => r.id === selectedRequestId);
    req.status = "rejected";
    closeModal();
    renderRequests();

    /*
    BACKEND:
    POST /api/mentorship/reject
    body: { reason }
    */
}

renderRequests();