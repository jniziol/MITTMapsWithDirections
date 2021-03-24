const apiKey = 'MRiZ8DX5wsmKOkYYg57YAIV28j9n9GfM';
const token = 'pk.eyJ1Ijoiam9obmF0aGFubml6aW9sIiwiYSI6ImNqcG5oZjR0cDAzMnEzeHBrZGUyYmF2aGcifQ.7vAuGZ0z6CY0kXYDkcaOBg';
const form = document.querySelector('form');
const poiElement = document.querySelector('.points-of-interest');
let newMarker;

let lat;
let long;
let map;

mapboxgl.accessToken = 'pk.eyJ1Ijoiam9obmF0aGFubml6aW9sIiwiYSI6ImNqcG5oZjR0cDAzMnEzeHBrZGUyYmF2aGcifQ.7vAuGZ0z6CY0kXYDkcaOBg';

form.onsubmit = e => {
  const inputElement = e.target.querySelector('input');
  getLocationList(inputElement.value);
  inputElement.value = "";
  e.preventDefault();
}

poiElement.onclick = async e => {
  const target = e.target.closest(".poi");

  const response = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${long},${lat};${target.dataset.long},${target.dataset.lat}?alternatives=true&geometries=geojson&steps=true&access_token=${token}`)
  const directions = await response.json();

  if (map.getSource("route") !== undefined) {
    map.removeLayer("route");
    map.removeSource("route");
  }

  map.addSource("route", {
    type: "geojson",
    data: {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: directions.routes[0].geometry.coordinates,
      },
    },
  });

  map.addLayer({
    id: "route",
    type: "line",
    source: "route",
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": "#e35206",
      "line-width": 6,
    },
  });

  if (target !== null) {
    if (newMarker) newMarker.remove();

    newMarker = new mapboxgl.Marker()
      .setLngLat([target.dataset.long, target.dataset.lat])
      .setPopup(
        new mapboxgl.Popup({ closeButton: false }).setHTML(
          target.querySelector(".name").textContent
        )
      ) // add popup
      .addTo(map);

    newMarker.togglePopup();

    var bounds = directions.routes[0].geometry.coordinates.reduce(function (bounds, coord) {
      return bounds.extend(coord);
    }, new mapboxgl.LngLatBounds(directions.routes[0].geometry.coordinates[0], directions.routes[0].geometry.coordinates[0]));

    map.fitBounds(bounds, {
      padding: 100,
    });

    // map.flyTo({
    //   center: [target.dataset.long, target.dataset.lat],
    //   essential: true, // this animation is considered essential with respect to prefers-reduced-motion
    // });
  }
}

function getLocationList(query) {
  fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?proximity=${long},${lat}&types=poi&access_token=${token}&limit=10`)
    .then(resp => resp.json())
    .then(json => {
      insertIntoPOIList(json.features);
    });
}

navigator.geolocation.getCurrentPosition(function(position) {
  lat = position.coords.latitude;
  long = position.coords.longitude;

  console.log(position)

  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v9',
    center: [long, lat],
    zoom: 12
  });

  marker = new mapboxgl.Marker()
    .setLngLat([long, lat])
    .setPopup(new mapboxgl.Popup({closeButton: false}).setHTML("You Are Here")) // add popup
    .addTo(map);

  marker.togglePopup();
}, () => {}, {maximumAge:10000, timeout:5000, enableHighAccuracy: true});



// latitude: 49.812422;
// longitude: -97.0893328;

latitude: 49.812422;
longitude: -97.0893328;
function insertIntoPOIList(poiList) {
  poiElement.textContent = "";
  poiList.sort((a, b) => {
    return distance(lat, long, b.center[1], b.center[0], "K") - distance(lat, long, a.center[1], a.center[0], "K");
  });

  poiList.forEach(poi => {
    poiElement.insertAdjacentHTML('afterbegin', `
      <li class="poi" data-long="${poi.center[0]}" data-lat="${poi.center[1]}">
        <ul>
          <li class="name">${poi.text}</div>
          <li class="street-address">${poi.properties.address}</div>
          <li class="distance">${distance(lat, long, poi.center[1], poi.center[0], "K").toFixed(1)} KM</div>
        </ul>
      </li>
    `);
  });
}

function distance(lat1, lon1, lat2, lon2, unit) {
	if ((lat1 == lat2) && (lon1 == lon2)) {
		return 0;
	}
	else {
		var radlat1 = Math.PI * lat1/180;
		var radlat2 = Math.PI * lat2/180;
		var theta = lon1-lon2;
		var radtheta = Math.PI * theta/180;
		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		if (dist > 1) {
			dist = 1;
		}
		dist = Math.acos(dist);
		dist = dist * 180/Math.PI;
		dist = dist * 60 * 1.1515;
		if (unit=="K") { dist = dist * 1.609344 }
		if (unit=="N") { dist = dist * 0.8684 }
		return dist;
	}
}

