const jobs = [
    {
        title: "Software Engineer Intern",
        company: "Google",
        location: "Bangalore",
        type: "Internship",
        skills: ["DSA", "JavaScript", "React"],
        postedBy: "Alumni"
    },
    {
        title: "Backend Developer",
        company: "Infosys",
        location: "Pune",
        type: "Full-Time",
        skills: ["Java", "Spring Boot", "MySQL"],
        postedBy: "Alumni"
    },
    {
        title: "Frontend Engineer",
        company: "Microsoft",
        location: "Hyderabad",
        type: "Internship",
        skills: ["HTML", "CSS", "React"],
        postedBy: "Alumni"
    }
];

const jobsList = document.getElementById("jobsList");
const filterType = document.getElementById("filterType");
const searchJob = document.getElementById("searchJob");

/* ===== Render Jobs ===== */
function renderJobs(list) {
    jobsList.innerHTML = "";

    if (list.length === 0) {
        jobsList.innerHTML = `<p>No matching opportunities found.</p>`;
        return;
    }

    list.forEach(job => {
        jobsList.innerHTML += `
            <div class="job-card">
                <div class="job-info">
                    <h3>${job.title}</h3>
                    <div class="job-meta">
                        ${job.company} • ${job.location} • Posted by ${job.postedBy}
                    </div>
                    <div class="job-tags">
                        ${job.skills.map(skill => `<span>${skill}</span>`).join("")}
                    </div>
                </div>

                <div class="job-actions">
                    <span class="job-type ${
                        job.type === "Internship" ? "internship" : "fulltime"
                    }">
                        ${job.type}
                    </span><br>
                    <button class="apply-btn">View / Apply</button>
                </div>
            </div>
        `;
    });
}

/* ===== Filter Logic ===== */
function applyFilters() {
    const typeValue = filterType.value;
    const searchValue = searchJob.value.toLowerCase();

    const filteredJobs = jobs.filter(job => {
        const matchesType =
            typeValue === "All" || job.type === typeValue;

        const matchesSearch =
            job.title.toLowerCase().includes(searchValue) ||
            job.skills.some(skill =>
                skill.toLowerCase().includes(searchValue)
            );

        return matchesType && matchesSearch;
    });

    renderJobs(filteredJobs);
}

/* ===== Event Listeners ===== */
filterType.addEventListener("change", applyFilters);
searchJob.addEventListener("input", applyFilters);

/* ===== Initial Load ===== */
renderJobs(jobs);