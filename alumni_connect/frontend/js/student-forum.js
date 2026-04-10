// =====================
// SAMPLE FORUM DATA
// =====================
let forumData = [
    {
        id: 1,
        title: "How to prepare for technical interviews?",
        author: "Alex Kumar",
        time: "2 hours ago",
        replies: 23,
        category: "Career Advice"
    },
    {
        id: 2,
        title: "Best resources to learn React?",
        author: "Maria Garcia",
        time: "5 hours ago",
        replies: 18,
        category: "Learning"
    },
    {
        id: 3,
        title: "Resume review before placements",
        author: "John Smith",
        time: "1 day ago",
        replies: 12,
        category: "Resume"
    }
];

// =====================
// DOM ELEMENTS
// =====================
const discussionList = document.getElementById("discussionList");
const categoryItems = document.querySelectorAll("#categoryList li");

const modal = document.getElementById("questionModal");
const openBtn = document.getElementById("newTopicBtn");
const closeBtn = document.getElementById("closeModal");

const addQuestionForm = document.getElementById("addQuestionForm");
const questionTitle = document.getElementById("questionTitle");
const questionCategory = document.getElementById("questionCategory");
const questionDescription = document.getElementById("questionDescription");

// =====================
// RENDER FUNCTION
// =====================
function renderForum(selectedCategory = "All") {
    discussionList.innerHTML = "";

    forumData
        .filter(q => selectedCategory === "All" || q.category === selectedCategory)
        .forEach(q => {
            discussionList.innerHTML += `
                <div class="discussion-card">
                    <div>
                        <h3>${q.title}</h3>
                        <div class="discussion-meta">
                            ${q.author} • ${q.time} • ${q.replies} replies
                        </div>
                    </div>
                    <div>
                        <span class="category-badge">${q.category}</span>
                        <a href="forum-thread.html?id=${q.id}" class="view-link">
                            View Discussion
                        </a>
                    </div>
                </div>
            `;
        });
}

// =====================
// CATEGORY FILTER
// =====================
categoryItems.forEach(item => {
    item.addEventListener("click", () => {
        categoryItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");

        const category = item.dataset.category;
        renderForum(category);
    });
});

// =====================
// MODAL OPEN / CLOSE
// =====================
openBtn.onclick = () => modal.style.display = "flex";
closeBtn.onclick = () => modal.style.display = "none";

// =====================
// ADD QUESTION LOGIC
// =====================
addQuestionForm.addEventListener("submit", e => {
    e.preventDefault();

    const title = questionTitle.value.trim();
    const category = questionCategory.value;
    const description = questionDescription.value.trim();

    if (!title || !category) {
        alert("Title and category are required");
        return;
    }

    // Create new question object
    const newQuestion = {
        id: forumData.length + 1,
        title,
        author: "You",
        time: "just now",
        replies: 0,
        category,
        description
    };

    // Add to top
    forumData.unshift(newQuestion);

    // Reset form & close modal
    addQuestionForm.reset();
    modal.style.display = "none";

    // Re-render based on current category
    const activeCategory =
        document.querySelector("#categoryList li.active").dataset.category;

    renderForum(activeCategory);
});

// =====================
// INITIAL LOAD
// =====================
renderForum();
