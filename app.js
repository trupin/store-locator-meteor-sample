Places = new Mongo.Collection("places");

if (Meteor.isClient) {
    var distanceWidget = null;

    Template.map.onCreated(function () {
        GoogleMaps.ready('map', function (map) {
            initDistanceWidget(map.instance);

            var infoWindow = new google.maps.InfoWindow();
            var service = new google.maps.places.PlacesService(map.instance);
            var markers = {};

            var createStoreMarker = function (place) {
                var marker = new google.maps.Marker({
                    map: map.instance,
                    position: place.geometry.location
                });

                google.maps.event.addListener(marker, 'click', function () {
                    var self = this;

                    var request = {
                        placeId: place.place_id
                    };

                    service.getDetails(request, function (place, status) {
                        if (status == google.maps.places.PlacesServiceStatus.OK) {
                            infoWindow.setContent(
                                '<div>' + place.name + '</div>' +
                                '<div>' + place.adr_address + '</div>'
                            );
                            infoWindow.open(map.instance, self);
                        }
                    });
                });

                return marker;
            };

            Places.find().observe({
                added: function (document) {
                    markers[document._id] = createStoreMarker(document);
                },
                changed: function (newDocument) {
                    markers[newDocument._id].setPosition({
                        lat: newDocument.geometry.location.lat,
                        lng: newDocument.geometry.location.lng
                    });
                },
                removed: function (oldDocument) {
                    var marker = markers[oldDocument._id];
                    marker.setMap(null);
                    google.maps.event.clearInstanceListeners(marker);
                    delete markers[oldDocument._id];
                }
            });

            var init = function () {
                distanceWidget = new DistanceWidget({
                    map: map.instance,
                    distance: 1,
                    maxDistance: 100,
                    color: '#000000',
                    activeColor: '#5599bb',
                    sizerIcon: '/images/resize-off.png',
                    activeSizerIcon: '/images/resize.png'
                });
            };

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    map.instance.setCenter(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
                    init();
                });
            }
            else {
                init();
            }
        });
    });

    Meteor.startup(function () {
        GoogleMaps.load({v: '3', libraries: 'geometry,places'});
    });

    Template.map.helpers({
        mapOptions: function () {
            if (GoogleMaps.loaded()) {
                return {
                    center: new google.maps.LatLng(48.864716, 2.349014),
                    zoom: 14
                };
            }
        }
    });

    Template.body.events({
        'click #import-button': function () {
            Meteor.call('importStoresAroundParis');
        },
        'click #export-button': function () {
            var pos = distanceWidget.get('position');
            Meteor.call('exportStoresInCircle', {lat: pos.A, lng: pos.F}, distanceWidget.get('distance'), function (err, csv) {
                if (!err) {
                    window.open("data:text/csv;charset=utf-8," + encodeURI(csv))
                }
            });
        }
    });
}
else if (Meteor.isServer) {
    var Future = Npm.require('fibers/future');
    var GoogleMapsAPI = Meteor.npmRequire('googlemaps');
    var csv = Meteor.npmRequire('csv');

    var config = {
        key: 'AIzaSyDBfVgKKSoFpQ5i8fCL2EDwPPdu5iGNb6Y',
        stagger_time: 1000,
        encode_polylines: false,
        secure: true
    };

    var gmAPI = new GoogleMapsAPI(config);

    Meteor.methods({
        importStoresAroundParis: function () {
            var future = new Future();

            Places._ensureIndex({'location.coordinates':'2d'});

            Places.remove({}, function (err) {
                if (err)
                    return future.throw(err);

                gmAPI.placeSearch({
                    name: 'micromania',
                    location: '48.864716,2.349014',
                    radius: 50000
                }, Meteor.bindEnvironment(function (err, data) {
                    if (err)
                        return future.throw(err);

                    for (var i = 0; i < data.results.length; i++) {
                        var place = data.results[i];

                        place.location = {
                            type: 'Point',
                            coordinates: [place.geometry.location.lng, place.geometry.location.lat]
                        };

                        Places.insert(data.results[i]);
                    }

                    future.return();
                }));
            });

            return future.wait();
        },
        exportStoresInCircle: function (center, radius) {
            var future = new Future();

            var places = Places.find({
                'location.coordinates': {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [center.lng, center.lat]
                        },
                        $maxDistance: radius * 1000,
                        $minDistance: 0
                    }
                }
            }).map(function (item) {
                return item;
            });

            csv.stringify(places, Meteor.bindEnvironment(function (err, data) {
                if (err)
                    return future.throw(err);

                future.return(data);
            }));

            return future.wait();
        }
    });
}