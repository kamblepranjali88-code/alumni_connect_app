const roleSelect = document.getElementById("role");
const studentSection = document.getElementById("studentSection");
const alumniSection = document.getElementById("alumniSection");

roleSelect.addEventListener("change", () => {
    studentSection.style.display = "none";
    alumniSection.style.display = "none";

    if (roleSelect.value === "student") {
        studentSection.style.display = "block";
    }

    if (roleSelect.value === "alumni") {
        alumniSection.style.display = "block";
    }
});

document.getElementById("profileForm").addEventListener("submit", e => {
    e.preventDefault();

    const profileData = {
        name: name.value,
        role: roleSelect.value,
        branch: branch.value,
        bio: bio.value,
        mentorship: availableForMentorship?.checked || false
    };

    console.log("Profile Data:", profileData);

    alert("Profile saved successfully!");

    /*
    BACKEND READY:
    POST /api/profile/save
    */
});