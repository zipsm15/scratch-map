var objectClass = null, objectGroups = null;

if (maptype == 'c') {
  objectClass = document.querySelector('.countries');
  objectGroups = objectClass.querySelectorAll(':scope > g');
} else if (maptype == 's') {
  objectClass = document.querySelector('.states');
  objectGroups = objectClass.querySelectorAll(':scope > g');
}

renderScratched(objectGroups);

for (let i = 0; i < objectGroups.length; i++) {
  objectGroups[i].addEventListener('click', clickObject);
}

async function clickObject(e) {
  e.stopPropagation();
  e.preventDefault();

  let object = {
    code: '',
    name: '',
    year: '',
    url: ''
  };

  let parentGroup = null;
  if (maptype == 'c') {
    parentGroup = e.target.closest('.countries > g');
  } else if (maptype == 's') {
    parentGroup = e.target.closest('.states > g');
  }
  if (parentGroup !== null) {
    object.code = parentGroup.id;
  }

  // get name of object
  for (var key of Object.keys(objectList)) {
    if (object.code.toUpperCase() == key.toUpperCase()) {
      object.name = objectList[key];
    }
  }

  // determine if object has already been scratched
  let scratched = false;
  for (let i=0; i<scratchedObjects.length; i++) {
    if (scratchedObjects[i].code.toUpperCase() == object.code.toUpperCase()) {
      scratched = true;

      object.year = scratchedObjects[i].year;
      object.url = scratchedObjects[i].url;
    }
  }

  let saResponse = null;
  let keepScratched = null;
  // Prompt user
  if (scratched) {
    saResponse = await Swal.fire({
      title: `Update ${object.name}?`,
      icon: 'question',
      html:
        `<label for="swal2-checkbox-1" class="swal2-checkbox" style="display: flex;">` +
          `<span class="swal2-label">Scratched: </span>` +
          `<input type="checkbox" id="swal2-checkbox-1" checked>` +
        `</label>` +
        `<br/>` +
        `<label for="swal2-input-1" class="swal2-input-label">Year you visited</label>` +
        `<input id="swal2-input-1" class="swal2-input" placeholder="${new Date().getFullYear()}" value="${object.year || ''}" type="text" style="width: -webkit-fill-available;">` +
        `<label for="swal2-input-2" class="swal2-input-label">Link to Photo Album</label>` +
        `<input id="swal2-input-2" class="swal2-input" placeholder="https://mycloud.com/${object.name.toLowerCase()}-trip-photos" value="${object.url || ''}" type="text" style="width: -webkit-fill-available;">`,
        preConfirm: () => {
          return {
            checkbox: document.getElementById('swal2-checkbox-1').checked,
            year: document.getElementById('swal2-input-1').value,
            url: document.getElementById('swal2-input-2').value
          }
        },
      showConfirmButton: true,
      showDenyButton: true,
      confirmButtonText: 'Yes',
      denyButtonText: 'No',
      confirmButtonColor: '#4d9e1b',
      denyButtonColor: '#f54b38'
    });

    if (saResponse.isConfirmed) {
      if (saResponse.value.checkbox) {
        keepScratched = true;
      } else {
        keepScratched = false;
      }
    }
  } else if (!scratched) {
    saResponse = await Swal.fire({
      title: `Scratch ${object.name}?`,
      icon: 'question',
      html:
        `<label for="swal2-input-1" class="swal2-input-label">Year you visited</label>` +
        `<input id="swal2-input-1" class="swal2-input" placeholder="${new Date().getFullYear()}" type="text" style="width: -webkit-fill-available;">` +
        
        `<label for="swal2-input-2" class="swal2-input-label">Link to Photo Album</label>` +
        `<input id="swal2-input-2" class="swal2-input" placeholder="https://mycloud.com/${object.name.toLowerCase()}-trip-photos" type="text" style="width: -webkit-fill-available;">`,
      preConfirm: () => {
        return {
          year: document.getElementById('swal2-input-1').value,
          url: document.getElementById('swal2-input-2').value
        }
      },
      showConfirmButton: true,
      showDenyButton: true,
      confirmButtonText: 'Yes',
      denyButtonText: 'No',
      confirmButtonColor: '#4d9e1b',
      denyButtonColor: '#f54b38'
    });
  };

  if (saResponse == null) {
    Toast.fire({
      icon: 'error',
      title: 'An unknown error has occurred' 
    });
  } else if (saResponse.isConfirmed) {
    const rawResponse = await fetch('/scratch', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        'type': maptype,
        'code': object.code,
        'scratch': !scratched ? true : (keepScratched ? true : false),
        'year': saResponse.value.year,
        'url': saResponse.value.url
      })
    });
    let jsonResponse = await rawResponse.json();

    // handle api response
    if (jsonResponse.status == 200) {
      let dataSet = jsonResponse.scratched;
      scratchedObjects = dataSet;

      if (maptype == 'c') {
        objectClass = document.querySelector('.countries');
        objectGroups = objectClass.querySelectorAll(':scope > g');
      } else if (maptype == 's') {
        objectClass = document.querySelector('.states');
        objectGroups = objectClass.querySelectorAll(':scope > g');
      }
      renderScratched(objectGroups);

      Toast.fire({
        icon: 'success',
        title: jsonResponse.message
      })
    } else {
      Toast.fire({
        icon: 'error',
        title: jsonResponse.message
      });
    }
    
  }
}

function renderScratched(objects) {  
  for (let i = 0; i < objects.length; i++) {
    objects[i].classList.remove('scratched');
  }

  for (let i=0; i<scratchedObjects.length; i++) {
    for (let j = 0; j < objects.length; j++) {
      if (scratchedObjects[i].code.toUpperCase() == objects[j].id.toUpperCase()) {
        objects[j].classList.add('scratched');
      }
    }
  }
}

// preconfigured toast object
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
});