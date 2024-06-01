'use strict';

import './../../node_modules/leaflet';
import ShortUniqueId from 'short-unique-id';
import Swal from 'sweetalert2';

class Workout {
  date = new Date();
  id = new ShortUniqueId({ length: 10 }).rnd();

  constructor(distance, duration, coords) {
    this.distance = distance; //[lat, lng]
    this.duration = duration;
    this.coords = coords;
  }

  _describtion() {
    const date = Intl.DateTimeFormat('en-US', { month: 'long', day: '2-digit' }).format(this.date);
    return this.describtion = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${date}`
  }

  _convertObjectToClass(obj) {
    Object.keys(obj).forEach(key => this[key] = obj[key]);
  }
};

class Running extends Workout {
  type = 'running';

  constructor(distance, duration, coords, cadance) {
    super(distance, duration, coords);
    this.cadance = cadance;

    this._describtion()
    this.calcPace();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
};

class Cycling extends Workout {
  type = 'cycling';

  constructor(distance, duration, coords, elevationGain) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;

    this._describtion();
    this.calcSpeed();
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
};


//////////////////////////////////////////
//Application CLASS 

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const deleteAllButton = document.querySelector('.deleteAll__button');
const sortButton = document.querySelector('.sort__button');
const fadeElements = document.querySelector('.fade__el');

class App {

  #map;
  #mapE;
  #mapZoomLevel = 13;
  #workouts = [];
  #marker = {};
  #isSort = true;
  #swalWithBootstrapButtons = Swal.mixin({
    backdrop: false,
    animation: true,
    stopKeydownPropagation: true,
    background: '#42484d',
    color: 'white',
    willOpen: () => {
      fadeElements.classList.remove('fade__elements');
      fadeElements.classList.add('unfade__elements');
    },
    willClose: () => {
      fadeElements.classList.add('fade__elements');
      fadeElements.classList.remove('unfade__elements');
    },
    customClass: {
      confirmButton: "btn btn-success",
      cancelButton: "btn btn-danger",
      popup: 'swal2-show',
      backdrop: 'swal2-backdrop-show',
      icon: 'swal2-icon-show',
    },
  });


  constructor() {
    //Get position
    this._getPosition();

    //Handle Event handlers 
    document.body.addEventListener('keydown', e => e.key === 'Escape' ? this._hideForm() : null);
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationFiled);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    containerWorkouts.addEventListener('click', this._editWorkout.bind(this));
    containerWorkouts.addEventListener('click', this._deleteWorkout.bind(this));
    deleteAllButton.addEventListener('click', this._deleteAllWorkouts.bind(this));
    sortButton.addEventListener('click', this._sortWorkouts.bind(this));


    //Load The Data from local storage 
    this._getLocalStorage();
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
        return Swal.fire({
          title: 'Mapty',
          text: 'Unable to retrieve your location. Please enable location and try again.',
          icon: 'error',
          iconColor: 'rgb(244 63 94)',
          position: 'center',
          animation: true,
          backdrop: true,
          timerProgressBar: true,
          showConfirmButton: true,
          confirmButtonColor: '#00c46a',
          backdrop: false,
          timer: 3000,
          background: '#42484d',
          color: 'white',
        });
      });
    };
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.#map);

    Swal.fire({
      title: '<h5 class="text-rose-500 font-gotham-book text-xl">Hint 👇🏻</h5>',
      text: 'Click on the map to add a new workout 😉',
      toast: true,
      position: 'top-right',
      timer: 5000,
      timerProgressBar: true,
      showConfirmButton: false,
      background: '#42484d',
      color: 'white',
    });

    this.#map.on('click', this._showForm.bind(this));

    // Load Workouts after loading the map
    this.#workouts.forEach(work => this._renderWorkoutMarker(work));
  }

  _showForm(mapEvent) {
    form.scrollIntoView({ behavior: 'smooth' });

    inputDistance.focus();
    form.classList.add('form__shown');
    form.classList.remove('form__hidden', 'hidden');
    this.#mapE = mapEvent;

  }

  _hideForm() {
    inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = '';

    form.classList.remove('form__shown');
    form.classList.add('form__hidden');
    const timer = setTimeout(() => {
      form.classList.add('hidden');
    }, 1000);
    // clearTimeout(timer);
  }

  _toggleElevationFiled() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _deleteAllWorkouts(e) {
    const btn = e.target.closest('.deleteAll__button');
    const workoutEl = document.querySelectorAll('.workout');

    //Gaurd Cluase
    if (!btn) return;
    if (!this.#workouts.length > 0) {
      return Swal.fire({
        title: 'Mapty',
        text: 'There isn\'t any workout to delete !',
        icon: 'error',
        iconColor: 'rgb(244 63 94)',
        grow: 'row',
        position: 'top-end',
        animation: true,
        toast: true,
        timerProgressBar: true,
        showConfirmButton: false,
        timer: 2000,
      });
    }


    this.#swalWithBootstrapButtons.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this !",
      icon: "warning",
      iconColor: 'rgb(244 63 94)',
      showCancelButton: true,
      confirmButtonText: "Yes, delete All!",
      confirmButtonColor: "#00c46a",
      cancelButtonText: "No, cancel!",
      cancelButtonColor: "rgb(244 63 94)",
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.#swalWithBootstrapButtons.fire({
          title: "Deleted!",
          text: "Your workouts has been deleted ✔",
          icon: "success",
          confirmButtonColor: '#00c46a',
        });
        workoutEl.forEach((el, i) => {
          el.dataset.id === this.#workouts.at(`${-1 - i}`).id ? el.remove() : null
          this.#marker[el.dataset.id].remove();
        });
        this.#workouts.splice(0);
        this._setLocalStorage();
      } else if (
        result.dismiss === Swal.DismissReason.cancel
      ) {
        this.#swalWithBootstrapButtons.fire({
          title: "Cancelled",
          text: "Your workouts are still there :)",
          icon: "error",
          confirmButtonColor: 'rgb(244 63 94)',
        });
      }
    });
  }

  _deleteWorkout(e) {
    const btn = e.target.closest('.delete__button');
    const workoutEl = document.querySelectorAll('.workout');

    //Gaurd Cluase
    if (!btn) return;


    this.#swalWithBootstrapButtons.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      iconColor: 'rgb(244 63 94)',
      showCancelButton: true,
      confirmButtonText: "Yes, delete This workout!",
      confirmButtonColor: "#00c46a",
      cancelButtonText: "No, cancel!",
      cancelButtonColor: "rgb(244 63 94)",
      reverseButtons: true,

    }).then((result) => {
      if (result.isConfirmed) {
        this.#swalWithBootstrapButtons.fire({
          title: "Deleted!",
          text: "Your workout has been deleted ✔",
          icon: "success",
          confirmButtonColor: '#00c46a',
        });

        //Remove Data
        workoutEl.forEach(el => {
          if (el.dataset.id === btn.getAttribute('id')) {
            const currentWorkout = this.#workouts.findIndex(work => work.id === btn.getAttribute('id'));

            //Remove Html element
            el.remove();

            //Remove Marker
            this.#marker[el.dataset.id].remove();

            //Remove from the workouts
            this.#workouts.splice(currentWorkout, currentWorkout + 1);
            this._setLocalStorage();
          }
        })
      } else if (
        result.dismiss === Swal.DismissReason.cancel
      ) {
        this.#swalWithBootstrapButtons.fire({
          title: "Cancelled",
          text: "Your workout is still there :)",
          icon: "error",
          confirmButtonColor: 'rgb(244 63 94)',
        });
      }
    });

  }

  _editWorkout(e) {
    const btn = e.target.closest('.edit__button');
    const workoutEl = document.querySelectorAll('.workout');
    let currentWorkout;

    //Gaurd Clause
    if (!btn) return;

    workoutEl.forEach(el => {
      if (el.dataset.id === btn.getAttribute('id')) currentWorkout = this.#workouts.find(work => work.id === btn.getAttribute('id'));
    });

    let workoutHTMLForm = ` 
    <form class="grid grid-cols-1 gap-4 bg-dark-zinc text-dark-zinc p-4 rounded-md h-max">

    <div class="form__row">
      <label for="selct-type" class="form__label">
        Distance
      </label>
      <input type="text" value="${currentWorkout.distance}"  class="form__input swal_form__input--distance">
    </div>

    <div class="form__row">
      <label for="selct-type" class="form__label">
        Duration
      </label>
      <input type="text" value="${currentWorkout.duration}" class="form__input swal_form__input--duration">
    </div>`;

    this.#swalWithBootstrapButtons.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "info",
      iconHtml: "!",
      iconColor: 'rgb(59 130 246)',
      html: workoutHTMLForm += currentWorkout.type === 'running' ? `
        <div class="form__row">
        <label for="selct-type" class="form__label">Cadence</label>
        <input type="text" value="${currentWorkout.cadance}" class="form__input swal_form__input--cadence">
      </div>
    </form>` : ` 
      <div class="form__row">
        <label class="form__label">Elev Gain</label>
        <input class="form__input swal_form__input--elevation" value="${currentWorkout.elevationGain}" />
      </div>
    </form>`,
      showCloseButton: true,
      closeButtonHtml: `<span class="text-3xl font-semibold text-light hover:text-rose-500 transition-colors duration-300">x</span>`,
      showConfirmButton: true,
      confirmButtonColor: 'rgb(59 130 246)',
      buttonsStyling: `<button>CANCEL</button>`,
    }).then((result) => {
      if (!result.isConfirmed) return;


      const type = document.querySelector('.form__input--type').value;
      const distance = +document.querySelector('.swal_form__input--distance').value;
      const duration = +document.querySelector('.swal_form__input--duration').value;
      const currentWorkoutEl = e.target.closest('.workout');


      const calcPace = () => parseInt((duration / distance).toFixed(1));
      const calcSpeed = () => parseInt((distance / (duration / 60)).toFixed(1));

      let workouts = this.#workouts;

      if (currentWorkoutEl.dataset.id !== currentWorkout.id) return;

      const currentworkoutDurationEl = document.querySelector('.workout--duration');
      const currentworkoutDistanceEl = document.querySelector('.workout--distance');

      const updateWorkoutData = function (currentWorkoutIndex, { distance, duration, cadance, elevationGain }, { currentworkoutDurationEl, currentworkoutDistanceEl, currentworkoutCadanceEl, currentworkoutPaceEl, currentworkoutElevationEl, currentworkoutSpeedEl }) {

        workouts[currentWorkoutIndex].distance = distance;
        workouts[currentWorkoutIndex].duration = duration;

        currentworkoutDistanceEl.innerText = distance;
        currentworkoutDurationEl.innerText = duration;

        if (cadance) {
          workouts[currentWorkoutIndex].cadance = cadance;
          workouts[currentWorkoutIndex].pace = calcPace();

          currentworkoutCadanceEl.innerText = cadance;
          currentworkoutPaceEl.innerText = calcPace().toFixed(1);
        };

        if (elevationGain) {
          workouts[currentWorkoutIndex].elevationGain = elevationGain;
          workouts[currentWorkoutIndex].speed = calcSpeed();

          currentworkoutElevationEl.innerText = elevationGain;
          currentworkoutSpeedEl.innerText = calcSpeed().toFixed(1);
        };

        return workouts;
      };

      //If workout running, create workout Running Object
      if (currentWorkout.type === 'running') {
        const cadance = +document.querySelector('.swal_form__input--cadence').value;

        const currentworkoutPaceEl = document.querySelector('.workout--pace');
        const currentworkoutCadanceEl = document.querySelector('.workout--cadance');

        //Validate Inputs 
        if (!this._isNum(duration, distance, cadance) || !this._isPos(duration, distance, cadance)) {
          return this._notValidMessage();
        };

        //Success Message
        this._SuccessMessage(type);

        // Add/Edit Inputs 
        workoutEl.forEach(el => {
          if (el.dataset.id === btn.getAttribute('id')) {
            const currentWorkoutIndex = this.#workouts.findIndex(work => work.id === btn.getAttribute('id'));

            updateWorkoutData(currentWorkoutIndex, {
              distance: distance,
              duration: duration,
              cadance: cadance,
            }, {
              currentworkoutDurationEl: currentworkoutDurationEl,
              currentworkoutDistanceEl: currentworkoutDistanceEl,
              currentworkoutCadanceEl: currentworkoutCadanceEl,
              currentworkoutPaceEl: currentworkoutPaceEl,
            });

            this.#workouts = workouts;
            this._setLocalStorage();
          }
        });
      };

      // If workout Cycling, create workout Cycling Cycling
      if (currentWorkout.type === 'cycling') {
        const elevation = +document.querySelector('.swal_form__input--elevation').value;

        const currentworkoutElevationEl = document.querySelector('.workout--elevation');
        const currentworkoutSpeedEl = document.querySelector('.workout--speed');

        //Validate Inputs
        if (!this._isNum(duration, distance, elevation) || !this._isPos(duration, distance)) {
          return this._notValidMessage();
        };

        //Success Message
        this._SuccessMessage(type);

        // Add/Edit Inputs
        workoutEl.forEach(el => {
          if (el.dataset.id === btn.getAttribute('id')) {
            const currentWorkoutIndex = this.#workouts.findIndex(work => work.id === btn.getAttribute('id'));

            updateWorkoutData(currentWorkoutIndex, { distance: distance, duration: duration, cadance: undefined, elevationGain: elevation }, {
              currentworkoutDurationEl: currentworkoutDurationEl,
              currentworkoutDistanceEl: currentworkoutDistanceEl,
              currentworkoutCadanceEl: undefined,
              currentworkoutPaceEl: undefined,
              currentworkoutElevationEl: currentworkoutElevationEl,
              currentworkoutSpeedEl: currentworkoutSpeedEl,
            });

            this._setLocalStorage();
          }
        });
      };

    });
  }

  _sortWorkouts() {
    const workouts = this.#isSort ? this.#workouts.slice().sort((a, b) => a.type.localeCompare(b.type)) : this.#workouts;

    while (form.nextElementSibling) form.nextElementSibling.remove();

    workouts.forEach(workout => {
      this._renderWorkout(workout);
    });

    this.#isSort = !this.#isSort;
  }

  _newWorkout(e) {
    e.preventDefault();

    //Get Data from the Form
    const type = inputType.value;
    const duration = +inputDuration.value;
    const distance = +inputDistance.value;
    const { lat, lng } = this.#mapE.latlng;
    let workout;

    //If workout running, create workout Running Object
    if (type === 'running') {
      const cadance = +inputCadence.value;

      //Validate Inputs 
      if (!this._isNum(duration, distance, cadance) || !this._isPos(duration, distance, cadance)) {
        return this._notValidMessage();
      };

      //Success Message
      this._SuccessMessage(type)

      workout = new Running(distance, duration, [lat, lng], cadance);
    };

    // If workout Cycling, create workout Cycling Object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      //Validate Inputs
      if (!this._isNum(duration, distance, elevation) || !this._isPos(duration, distance)) {
        return this._notValidMessage(type);
      };

      //Success Message
      this._SuccessMessage(type)

      workout = new Cycling(distance, duration, [lat, lng], elevation);
    };

    //Add new Object to workout Array
    this.#workouts.push(workout);

    //Render The marker on the Map
    this._renderWorkoutMarker(workout);

    //Render workout on the list
    this._renderWorkout(workout);

    //Hide + clear input fields
    this._hideForm();

    //Set Local Stoarge to Save workouts
    this._setLocalStorage();
  }

  _isNum = (...inputs) => inputs.every(input => Number.isFinite(input))

  _isPos = (...inputs) => inputs.every(input => input > 0)

  _notValidMessage() {
    return Swal.fire({
      title: 'Mapty',
      text: 'You must enter positive value',
      icon: 'error',
      iconColor: 'rgb(244 63 94)',
      background: '#2d3439',
      color: 'white',
      grow: 'row',
      position: 'top-end',
      animation: true,
      toast: true,
      showConfirmButton: false,
      timer: 2000,
    });
  }

  _SuccessMessage(type) {
    Swal.fire({
      title: 'Mapty',
      text: 'Successfully Created !',
      icon: 'success',
      iconColor: `${type === 'running' ? '#00c46a' : '#ffb545'}`,
      background: '#2d3439',
      color: 'white',
      grow: 'row',
      position: 'top-end',
      animation: true,
      toast: true,
      showConfirmButton: false,
      timer: 2000,
    });
  }

  _renderWorkoutMarker(workout) {
    this.#marker[`${workout.id}`] = new L.Marker(workout.coords, { riseOnHover: true }).addTo(this.#map).bindPopup(L.popup({
      maxWidth: 250,
      minWidth: 50,
      autoClose: false,
      closeOnClick: false,
      className: `${workout.type}-popup`,
    }))
      .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴🏻‍♀️'} ${workout.describtion}`)
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `      
    <li class="workout workout--${workout.type}" data-id=${workout.id}>
      <h2 class="workout__title">
        ${workout.describtion}
      </h2>
      <div class="workout__details">
        <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴🏻‍♀️'}</span>
        <span class="workout__value workout--distance">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>

      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value workout--duration">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>`;

    if (workout.type === 'running') {
      html +=
        `<div class="workout__details">
          <span class="workout__icon">⚡</span>
          <span class="workout__value workout--pace">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        
        <div class="workout__details">
          <span class="workout__icon">🦶🏻</span>
          <span class="workout__value workout--cadance">${workout.cadance}</span>
          <span class="workout__unit">spm</span>
        </div>
        <button id="${workout.id}" class="delete__button">
          Delete
        </button>
        <button id="${workout.id}" class="edit__button">
          Edit
        </button>
      </li>`;
    };

    if (workout.type === 'cycling') {
      html +=
        `<div class="workout__details">
          <span class="workout__icon">⚡</span>
          <span class="workout__value workout--speed">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        
        <div class="workout__details">
          <span class="workout__icon">🗻</span>
          <span class="workout__value workout--elevation">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
        <button id="${workout.id}" class="delete__button">
          Delete
        </button>
        <button id="${workout.id}" class="edit__button">
          Edit
        </button>
      </li>`;
    };

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workouts.find(workout => workout.id === workoutEl.dataset.id);

    try {
      this.#map.setView(workout.coords, this.#mapZoomLevel, {
        pan: {
          animate: true,
          duration: 1.5,
        }
      });
    }
    catch {
      return
    }
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const workouts = JSON.parse(localStorage.getItem('workouts'));

    //Gaurd Clause
    if (!workouts) return;

    //Retrive Data from local Storage 
    workouts.forEach(work => {
      if (work.type === 'running') {
        const running = new Running(work);
        running._convertObjectToClass(work);
        this.#workouts.push(running)
      };
      if (work.type === 'cycling') {
        const cycling = new Cycling(work);
        cycling._convertObjectToClass(work);
        this.#workouts.push(cycling);
      };
    });

    //Render Workouts markers 
    this.#workouts.forEach(work => this._renderWorkout(work));
  }
};

const app = new App();