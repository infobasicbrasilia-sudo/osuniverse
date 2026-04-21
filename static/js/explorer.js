console.log("Explorer iniciado");

function renderExplorer(){

const explorer = document.getElementById("explorer");

explorer.innerHTML = "";

let dir = getCurrentDir();

for(let item in dir){

let div = document.createElement("div");

div.className = "file";

div.innerText = item;

div.onclick = ()=>{

if(typeof dir[item] === "object"){

currentPath.push(item);

renderExplorer();

}

}

explorer.appendChild(div);

}

}

document.addEventListener("DOMContentLoaded",()=>{

renderExplorer();

});