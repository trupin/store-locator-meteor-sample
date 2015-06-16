# Store locator Meteor sample

This is a sample project which demonstrates how to implement a reactive store locator with a CSV export, using Meteor and the Google Maps API v3.

# Deploy it on your machine

    $ git pull git@github.com:trupin/mobeye-sample.git
    $ meteor
    $ open http://localhost:3000

# Or just have look at it...

[here](http://mobeyesample.meteor.com)

# Resources

Server side:
* The [node-googlemaps](https://github.com/moshen/node-googlemaps) module to request the stores locations.
* The [node-csv](https://github.com/wdavidw/node-csv) module to convert the the stores locations to csv.

Client side:
* The [meteorhacks:npm](https://github.com/meteorhacks/npm) package to be able to use Node modules directly from Meteor
* The [meteor-google-maps](https://github.com/dburles/meteor-google-maps) package to be able to use the Google Maps API v3 on the client side (basically, to show a map, the markers and an editable circle).
* The `DistanceWidget` is the MVC Object I used to draw an editable circle on the map. It is highly inspired of [this documentation from Google](https://developers.google.com/maps/articles/mvcfun)
