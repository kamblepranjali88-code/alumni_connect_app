async function loadMyJobs() {
    const userId = sessionStorage.getItem("userId");
    const container = document.getElementById("jobsHistoryContainer");

    try {
        const response = await fetch(
            `https://alumni-connect-backend-yy97.onrender.com/api/jobs/my-jobs?user_id=${userId}`
        );

        const data = await response.json();
        console.log("Jobs data:", data);

        const jobs = data.jobs || data || [];

        if (!jobs.length) {
            container.innerHTML = "<p>No jobs posted yet.</p>";
            return;
        }

        container.innerHTML = jobs.map(job => {
            const date = new Date(job.posted_date || job.created_at || Date.now()).toLocaleDateString();
            const jobId = job.job_id || job.id;

            return `
                <div class="job-card" id="job-card-${jobId}">
                    <div>
                        <div class="job-title">${job.title}</div>
                        <div class="job-company">${job.company}</div>
                        <div class="job-date">${date}</div>
                    </div>

                    <div class="job-actions">
                        <button class="btn-view-link"
                            onclick="window.open('${job.application_link}', '_blank')">
                            View
                        </button>

                        <button class="btn-copy-link"
                            onclick="copyLink('${job.application_link}')">
                            Copy
                        </button>

                        <button class="btn-delete-job"
                            onclick="deleteJob(${jobId})">
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join("");
    } catch (error) {
        console.error("Load jobs error:", error);
        container.innerHTML = "<p>Failed to load jobs</p>";
    }
}

async function deleteJob(jobId) {
    const userId = sessionStorage.getItem("userId");

    if (!confirm("Are you sure you want to delete this job?")) {
        return;
    }

    try {
        const response = await fetch(`https://alumni-connect-backend-yy97.onrender.com/api/jobs/${jobId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user_id: parseInt(userId)
            })
        });

        const result = await response.json();
        console.log("Delete response:", result);

        if (!response.ok) {
            alert(result.message || "Failed to delete job");
            return;
        }

        // Remove deleted card immediately from alumni history
        const card = document.getElementById(`job-card-${jobId}`);
        if (card) {
            card.remove();
        }

        // Reload jobs list to keep UI and DB in sync
        loadMyJobs();

        alert("Job deleted successfully");
    } catch (error) {
        console.error("Delete error:", error);
        alert("Error deleting job");
    }
}

function copyLink(link) {
    navigator.clipboard.writeText(link);
    alert("Link copied");
}

document.getElementById("postJobForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const userId = sessionStorage.getItem("userId");

    const jobData = {
        user_id: parseInt(userId),
        title: document.getElementById("title").value,
        company: document.getElementById("company").value,
        application_link: document.getElementById("applicationLink").value
    };

    try {
        const response = await fetch("https://alumni-connect-backend-yy97.onrender.com/api/jobs/post", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(jobData)
        });

        const result = await response.json();

        if (!response.ok) {
            alert(result.message || "Failed to post job");
            return;
        }

        document.getElementById("postJobForm").reset();
        loadMyJobs();
        alert("Job posted successfully");
    } catch (error) {
        console.error("Post job error:", error);
        alert("Error posting job");
    }
});

document.addEventListener("DOMContentLoaded", () => {
    loadMyJobs();
});
