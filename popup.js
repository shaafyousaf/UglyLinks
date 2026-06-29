const linksDiv = document.getElementById('links-container');
const inputLinkBox = document.getElementById('cmd_input');
// Helper function for the 3-second pause
const delay = ms => new Promise(res => setTimeout(res, ms));
let uglyLinks = {0: 'http://192.168.1.100:9000'};
let idIteration = 1;
let activeTabURL = "";

document.addEventListener('DOMContentLoaded', async() => {
    activeTabURL = await GetCurrentActiveUrl();
    UpdateResetButton(activeTabURL);
    await GetUpdatedData();
    await InitializeList();
});

document.getElementById('cmd_input').addEventListener('keydown', async (event) => {
    await SaveOrSearchInList(event);
});

document.getElementsByClassName("app-title")[0].addEventListener("click", async () => {
    chrome.tabs.create({url: "https://www.shaafyousaf.com/ULPolicy"});
});


let linksFiltered = false;
inputLinkBox.addEventListener("keyup", (event) => {
    
    if(event.key !== 'Enter') {
        let matchesID = {};
        const uglyRows = linksDiv.getElementsByClassName("link-row");
        const searchName = inputLinkBox.value;
        const outputEL = EnableAllLinks(searchName);
        if(outputEL == 0){
            return;
        }

        for (let i=0; i < uglyRows.length; i++){
            const divTop = uglyRows[i];
            const urlName = divTop.getElementsByClassName("link-url")[0].textContent;
           
            if(!urlName.includes(searchName)){
                divTop.style.display = "none";
            } else {
                divTop.style.display = "flex";
            }


            console.log(`${i}- Row Name: ${urlName}`);
        };
    };
});


function EnableAllLinks(searchName){
    const uglyRows = linksDiv.getElementsByClassName("link-row")
    if(searchName === ""){
        for (let i=0; i < uglyRows.length; i++){
            const divTop = uglyRows[i];
            divTop.style.display = "flex";
        }
        return 0;
    };
};

function nothingReally () {
    console.error("hello there senpai");
}

linksDiv.addEventListener('click', async (event) => {
    const target_element = event.target.closest('[data-id]');
    if (!target_element) return; // Guard clause in case they click container background
    const target_id = Number(target_element.dataset.id); 
    const target_type = event.target.closest('.trash-btn');
    
    if(target_type){
        delete uglyLinks[target_id];
        await SaveDataToChrome();
        const delRow = document.querySelector(`[data-id="${target_id}"]`);
        if(delRow) {
            delRow.remove();
        };
        return;
    }    
    const target_url = uglyLinks[target_id];
    
    if (target_url) {
        // window.open(target_url, "_blank");
        chrome.tabs.create({url: target_url});
    }
});

document.getElementById('reset_btn').addEventListener('click', async (event) => {
    await ExecuteLinkAddition(activeTabURL, false);
})

async function GetCurrentActiveUrl(){
    const queryOptions = { active: true, lastFocusedWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab?.url;
};

function UpdateResetButton(url) {
    const h1_button = document.getElementById('reset_btn');
    if(h1_button){
        try{
            const strippedUrl = new URL(url).hostname;
            h1_button.textContent = `add ${strippedUrl}`;   
        } catch(e) {
            console.error("Unable to change the button for current url. sad.")
        };
    };
    
};


// function FilterRows() {

// };


async function SaveOrSearchInList(event){
    if (event.key === 'Enter') {
        let url = inputLinkBox.value;

        EnableAllLinks("");

        await ExecuteLinkAddition(url);
    };
};

async function ExecuteLinkAddition(url, isLinkBox = true){
    const isValidURL = URL.canParse(url);
    if(isValidURL){
        idIteration++;
        let id = idIteration;
        await AddToLocalList(url).then(async (result) => {
            if(result){
                await AddLinkAsButton(id, url);                
            } else {
                console.log("Error saving button to local Chrome Storage.");
            }
        });
        if(isLinkBox){
            inputLinkBox.value = "";
            const txtInputBox = document.querySelector(".input-island");
            txtInputBox.classList.add("valid-input");
            await delay(3000);
            txtInputBox.classList.remove("valid-input");
        };

    } else if(isLinkBox && !isValidURL) {
        const tempURL = `https://${url}`;
        const isTempValid = URL.canParse(tempURL);
        if(isTempValid){
            inputLinkBox.value = tempURL;
            const txtInputBox = document.querySelector(".input-island");
            txtInputBox.classList.add("fixed-input");
            await delay(3000);
            txtInputBox.classList.remove("fixed-input");
        } else {
            inputLinkBox.value = "";
            const txtInputBox = document.querySelector(".input-island");
            txtInputBox.classList.add("invalid-input");
            await delay(3000);
            txtInputBox.classList.remove("invalid-input");
        }

        
        
    };
}

async function AddToLocalList(url){
    uglyLinks[idIteration] = url;
    return await SaveDataToChrome();
}

async function SaveDataToChrome(){
    try {
        await chrome.storage.local.set({ uglyLinks: uglyLinks });
        await chrome.storage.local.set({ idIterationShaaf: idIteration });
        return true;
    } catch(error) {
        return false;
    }
}

async function GetUpdatedData(){
    try{
        const data = await chrome.storage.local.get(["uglyLinks", "idIterationShaaf"]);
        
        let temp_uglyLinks = data.uglyLinks;
        let temp_idIteration = data.idIterationShaaf;

        if(temp_uglyLinks && temp_idIteration){
            uglyLinks = temp_uglyLinks;
            idIteration = temp_idIteration;
        } else {
            SaveDataToChrome();
            GetUpdatedData();
            return;
        }

    } catch(e){};
    
};

async function DeleteThisLink(id){
    let fullId = id.slice(3);
    console.error(fullId);
}

async function InitializeList(){
    Object.entries(uglyLinks).forEach(async ([savedId, savedUrl]) => {
        let templateButton = document.createElement('button');
        await AddLinkAsButton(savedId, savedUrl);
    });
};


async function AddLinkAsButton(id, url) {
    try{
        // 1. INSTANTIATE ALL ELEMENTS FIRST
        const linkRow = document.createElement('div');
        const linkInfo = document.createElement('div');
        const linkTitle = document.createElement('span');
        const linkUrl = document.createElement('span');

        const actionZone = document.createElement('div');
        const indicatorDot = document.createElement('div');
        const trashBtn = document.createElement('button');

        const svgNamespace = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNamespace, 'svg');
        const polyline = document.createElementNS(svgNamespace, 'polyline');
        const path = document.createElementNS(svgNamespace, 'path');


        // 2. ASSIGN PROPERTIES AND ATTRIBUTES
        // Outer row
        linkRow.className = 'link-row';
        linkRow.dataset.id = id;
        linkRow.role = "button"

        // Info section
        linkInfo.className = 'link-info';
        linkTitle.className = 'link-title';

        const parsedURL = new URL(url);
        

        linkTitle.textContent = parsedURL.hostname;



        linkUrl.className = 'link-url';
        linkUrl.textContent = url;

        // Action zone section
        actionZone.className = 'action-zone';
        indicatorDot.className = 'indicator-dot';

        // Button (Using secure dataset dataset.targetId instead of inline onclick)
        trashBtn.className = 'trash-btn';
        trashBtn.title = 'Delete';
        trashBtn.dataset.targetId = id; 

        // SVG Attributes
        svg.setAttribute('width', '14');
        svg.setAttribute('height', '14');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');

        // SVG Vector paths
        polyline.setAttribute('points', '3 6 5 6 21 6');
        path.setAttribute('d', 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2');


        // 3. ASSEMBLE HIERARCHY
        // Assemble Info block
        linkInfo.append(linkTitle, linkUrl);
        // linkInfo.append(linkTitle);

        // Assemble SVG & Button
        svg.append(polyline, path);
        trashBtn.append(svg);
        actionZone.append(indicatorDot, trashBtn);

        // Pack everything into the main row wrapper
        linkRow.append(linkInfo, actionZone);
        linksDiv.append(linkRow);
    } catch(error) {
        console.log("invalid url");
    }
}