async function loadMyJobs(){

const userId=sessionStorage.getItem("userId");

const container=document.getElementById("jobsHistoryContainer");

try{

const response=await fetch(
`http://localhost:5000/api/jobs/my-jobs?user_id=${userId}`
);

const data=await response.json();

if(!data.jobs || data.jobs.length===0){

container.innerHTML="<p>No jobs posted yet.</p>";
return;

}

container.innerHTML=data.jobs.map(job=>{

const date=new Date(job.posted_date)
.toLocaleDateString();

return`

<div class="job-card">

<div>

<div class="job-title">${job.title}</div>

<div class="job-company">
${job.company}
</div>

<div class="job-date">
${date}
</div>

</div>

<div class="job-actions">

<button class="btn-view-link"
onclick="window.open('${job.application_link}','_blank')">
View
</button>

<button class="btn-copy-link"
onclick="copyLink('${job.application_link}')">
Copy
</button>

<button class="btn-delete-job"
onclick="deleteJob(${job.id})">
Delete
</button>

</div>

</div>

`;

}).join("");

}
catch(error){

container.innerHTML="<p>Failed to load jobs</p>";

}

}



async function deleteJob(jobId){

const userId=sessionStorage.getItem("userId");

await fetch(`http://localhost:5000/api/jobs/${jobId}`,{

method:"DELETE",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({user_id:parseInt(userId)})

});

loadMyJobs();

}


function copyLink(link){

navigator.clipboard.writeText(link);

alert("Link copied");

}


document.getElementById("postJobForm")
.addEventListener("submit",async(e)=>{

e.preventDefault();

const userId=sessionStorage.getItem("userId");

const jobData={

user_id:parseInt(userId),

title:document.getElementById("title").value,

company:document.getElementById("company").value,

application_link:document.getElementById("applicationLink").value

};

await fetch("http://localhost:5000/api/jobs/post",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify(jobData)

});

document.getElementById("postJobForm").reset();

loadMyJobs();

});


document.addEventListener("DOMContentLoaded",()=>{

loadMyJobs();

});