let allJobs = [];

document.addEventListener("DOMContentLoaded", () => {

loadJobs();
setupListeners();

});


function setupListeners(){

document.getElementById("searchInput")
.addEventListener("input", filterJobs);

document.getElementById("filterCompany")
.addEventListener("change", filterJobs);

}


async function loadJobs(){

const grid = document.getElementById("jobsGrid");

try{

const response = await fetch("http://localhost:5000/api/jobs");
const data = await response.json();

if(!data.success){

grid.innerHTML="<p>No jobs available.</p>";
return;

}

allJobs = data.jobs;

populateCompanyFilter(allJobs);

displayJobs(allJobs);

}
catch(error){

console.error(error);

grid.innerHTML=
"<p>Failed to load jobs. Please refresh.</p>";

}

}


function populateCompanyFilter(jobs){

const companies=[...new Set(jobs.map(j=>j.company))];

const select=document.getElementById("filterCompany");

companies.sort().forEach(company=>{

select.innerHTML+=
`<option value="${company}">${company}</option>`;

});

}


function filterJobs(){

const search=document.getElementById("searchInput")
.value.toLowerCase();

const company=document.getElementById("filterCompany")
.value;

let filtered=allJobs;

if(search){

filtered=filtered.filter(job=>

job.title.toLowerCase().includes(search) ||
job.company.toLowerCase().includes(search)

);

}

if(company!=="all"){

filtered=filtered.filter(job=>job.company===company);

}

displayJobs(filtered);

}


function displayJobs(jobs){

const grid=document.getElementById("jobsGrid");

const count=document.getElementById("jobsCount");

const noResults=document.getElementById("noResults");

count.textContent=`${jobs.length} jobs`;

if(jobs.length===0){

grid.innerHTML="";
noResults.style.display="block";
return;

}

noResults.style.display="none";


grid.innerHTML=jobs.map(job=>{

const date=new Date(job.posted_date)
.toLocaleDateString();

return`

<div class="job-card">

<h3 class="job-title">${escapeHtml(job.title)}</h3>

<div class="job-company">
<i class="fas fa-building"></i>
${escapeHtml(job.company)}
</div>

<div class="job-posted-by">
Posted by ${escapeHtml(job.posted_by_name || "Alumni")}
</div>

<div class="job-date">
<i class="fas fa-calendar"></i>
${date}
</div>

<div class="job-divider"></div>

<div class="job-footer">

<a href="${job.application_link}"
target="_blank"
class="btn-apply">

<i class="fas fa-external-link-alt"></i>
Apply

</a>

<button class="btn-copy"
onclick="copyLink('${job.application_link}')">

Copy Link

</button>

</div>

</div>

`;

}).join("");

}


function escapeHtml(text){

const div=document.createElement("div");
div.textContent=text;
return div.innerHTML;

}


function copyLink(link){

navigator.clipboard.writeText(link);

alert("Link copied!");

}