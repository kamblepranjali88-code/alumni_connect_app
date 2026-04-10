// ==========================
// SAMPLE DATA (TEMP)
// ==========================
const forumData = [
    {
        id: 1,
        title: "How to prepare for technical interviews?",
        author: "Alex Kumar",
        role: "Student",
        time: "2 hours ago",
        category: "Career Advice",
        description:
            "I am preparing for placements and want to know how to structure my technical preparation.",
        replies: [
            { user: "Rahul Patil", role: "Alumni", text: "Practice DSA daily and revise OS, DBMS." },
            { user: "Sneha Patil", role: "Student", text: "Mock interviews helped me a lot." }
        ]
    },
    {
        id: 2,
        title: "Best resources to learn React?",
        author: "Maria Garcia",
        role: "Student",
        time: "5 hours ago",
        category: "Learning",
        description:
            "I want to start React from scratch. Please suggest best resources.",
        replies: [
            { user: "Amit Shah", role: "Alumni", text: "React docs + small projects are best." }
        ]
    },
    {
        id: 3,
        title: "Resume review before placements",
        author: "John Smith",
        role: "Student",
        time: "1 day ago",
        category: "Resume",
        description:
            "Can someone review my resume before placement season?",
        replies: []
    }
];

// ==========================
// GET QUESTION ID
// ==========================
const params = new URLSearchParams(window.location.search);
const questionId = parseInt(params.get("id"));

// Find question
const question = forumData.find(q => q.id === questionId);

// If invalid ID
if (!question) {
    alert("Question not found");
}

// ==========================
// LOAD QUESTION
// ==========================
document.getElementById("questionTitle").innerText = question.title;
document.getElementById("questionAuthor").innerText =
    `${question.author} (${question.role})`;
document.getElementById("questionTime").innerText = question.time;
document.getElementById("questionCategory").innerText = question.category;
document.getElementById("questionDescription").innerText = question.description;

// ==========================
// LOAD REPLIES
// ==========================
const repliesList = document.getElementById("repliesList");

function renderReplies() {
    repliesList.innerHTML = "";

    if (question.replies.length === 0) {
        repliesList.innerHTML = "<p>No replies yet.</p>";
        return;
    }

    question.replies.forEach(r => {
        repliesList.innerHTML += `
            <div class="reply-card">
                <div class="reply-header">
                    <strong>${r.user}</strong>
                    <span>${r.role}</span>
                </div>
                <p>${r.text}</p>
            </div>
        `;
    });
}

renderReplies();

// ==========================
// POST REPLY
// ==========================
document.getElementById("postReplyBtn").addEventListener("click", () => {
    const replyText = document.getElementById("replyText").value.trim();

    if (!replyText) {
        alert("Reply cannot be empty");
        return;
    }

    question.replies.push({
        user: "You",
        role: "Student",
        text: replyText
    });

    document.getElementById("replyText").value = "";
    renderReplies();

    /*
      BACKEND READY:
      POST /api/forum/{id}/reply
    */
});
