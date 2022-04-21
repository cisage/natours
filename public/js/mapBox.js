const displayMap = (maplocations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoicnVjaGlyMTEiLCJhIjoiY2wyMzJuMW4yMW0yaTNqcW9rMmE1YjN5bSJ9.HTNGJw7xgxZKeip5kc0t-A';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/ruchir11/cl233cfhw008t15o6d9u89dqe',
    //   center: [-118.11349134, 34.111745],
    //   zoom: 4,
    scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  maplocations.forEach((loc) => {
    const el = document.createElement('div');
    el.className = 'marker';

    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};

const mapBox = document.getElementById('map');
if (mapBox) {
  const maplocations = JSON.parse(
    document.getElementById('map').dataset.locations
  );
  displayMap(maplocations);
}
