const alumni = [
    {
        name: "Rahul Patil",
        branch: "CSE",
        year: "2021",
        company: "Google",
        role: "Software Engineer",
        available: true
    },
    {
        name: "Sneha Kulkarni",
        branch: "IT",
        year: "2020",
        company: "Infosys",
        role: "Backend Developer",
        available: false
    },
    {
        name: "Amit Sharma",
        branch: "ENTC",
        year: "2022",
        company: "Microsoft",
        role: "Cloud Engineer",
        available: true
    }
];

const list = document.getElementById("alumniList");
const searchInput = document.getElementById("searchInput");

const branchFilter = document.getElementById("filterBranch");
const yearFilter = document.getElementById("filterYear");
const availabilityFilter = document.getElementById("filterAvailability");

function render(data) {
    list.innerHTML = "";

    if (data.length === 0) {
        list.innerHTML = "<p>No alumni found.</p>";
        return;
    }

    data.forEach(a => {
        list.innerHTML += `
            <div class="alumni-item">
                <div class="alumni-info">
                    <span class="alumni-name">${a.name}</span>
                    <span class="alumni-meta">
                        ${a.role} at ${a.company}<br>
                        ${a.branch} • Passout ${a.year}
                    </span>
                    <span class="badge ${a.available ? "available" : "unavailable"}">
                        ${a.available ? "Available for Mentorship" : "Not Available"}
                    </span>
                </div>

                <div class="actions">
                    <button class="view-btn">View Profile</button>
                    <button class="request-btn"
                        ${a.available ? "" : "disabled"}>
                        Request
                    </button>
                </div>
            </div>
        `;
    });
}

function applyFilters() {
    const search = searchInput.value.toLowerCase();
    const branch = branchFilter.value;
    const year = yearFilter.value;
    const availability = availabilityFilter.value;

    const filtered = alumni.filter(a => {
        const matchesSearch =
            a.name.toLowerCase().includes(search) ||
            a.company.toLowerCase().includes(search) ||
            a.role.toLowerCase().includes(search);

        const matchesBranch = branch === "All" || a.branch === branch;
        const matchesYear = year === "All" || a.year === year;
        const matchesAvailability =
            availability === "All" ||
            (availability === "Available" && a.available) ||
            (availability === "Unavailable" && !a.available);

        return (
            matchesSearch &&
            matchesBranch &&
            matchesYear &&
            matchesAvailability
        );
    });

    render(filtered);
}

searchInput.addEventListener("input", applyFilters);
branchFilter.addEventListener("change", applyFilters);
yearFilter.addEventListener("change", applyFilters);
availabilityFilter.addEventListener("change", applyFilters);

document.getElementById("clearFilters").onclick = () => {
    branchFilter.value = "All";
    yearFilter.value = "All";
    availabilityFilter.value = "All";
    searchInput.value = "";
    render(alumni);
};

render(alumni);