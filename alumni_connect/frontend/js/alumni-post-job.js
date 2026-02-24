let postedJobs = [
    {
        title: "Frontend Developer Intern",
        type: "Internship",
        location: "Remote",
        skills: ["HTML", "CSS", "React"]
    }
];

const postedJobsList = document.getElementById("postedJobsList");
const jobForm = document.getElementById("jobForm");

/* Render posted jobs */
function renderPostedJobs() {
    postedJobsList.innerHTML = "";

    if (postedJobs.length === 0) {
        postedJobsList.innerHTML = "<p>No jobs posted yet.</p>";
        return;
    }

    postedJobs.forEach(job => {
        postedJobsList.innerHTML += `
            <div class="posted-job">
                <h3>${job.title}</h3>
                <div class="meta">${job.location} • ${job.skills.join(", ")}</div>
                <span class="type">${job.type}</span>
            </div>
        `;
    });
}

/* Submit job */
jobForm.addEventListener("submit", e => {
    e.preventDefault();

    const newJob = {
        title: jobTitle.value,
        type: jobType.value,
        location: location.value,
        skills: skills.value.split(",")
    };

    postedJobs.unshift(newJob);
    renderPostedJobs();
    jobForm.reset();

    /*
    BACKEND READY:
    POST /api/jobs
    */
});

/* Initial load */
renderPostedJobs();