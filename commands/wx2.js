// weather2 command

const {
  createCanvas,
  loadImage,
  Image
} = require('canvas');
const canvas = createCanvas(400, 220);
const ctx = canvas.getContext('2d');

const getConditionFillColor = (temperature, units) => {
  let color = '#000000';
  switch (units) {
    case 'imperial':
      if (temperature < 20) color = '#463763';
      else if (temperature < 40) color = '#33426b';
      else if (temperature < 60) color = '#32642e';
      else if (temperature < 80) color = '#7d7d2f';
      else if (temperature < 100) color = '#855d32';
      else color = '#682b2e';
      break;
    default:
      if (temperature < -6) color = '#463763';
      else if (temperature < 5) color = '#33426b';
      else if (temperature < 16) color = '#32642e';
      else if (temperature < 27) color = '#7d7d2f';
      else if (temperature < 38) color = '#855d32';
      else color = '#682b2e';
      break;
  }

  return color;
};

exports.names = ['wx2', 'weather2'];
exports.handler = function(data, args) {
  if (!args) args = "ames";
  if (args) {
    request('https://www.mapquestapi.com/geocoding/v1/address?key=' + process.env.MAPQUEST_KEY + '&location=' + args, function cbfunc(error, response, body) {
      //If call returned correctly, continue
      if (!error && response.statusCode == 200) {
        var formatted = JSON.parse(body);

        if (formatted.results[0].locations[0].adminArea5 != "") {
          var locationStr = formatted.results[0].locations[0].adminArea5 + " " + formatted.results[0].locations[0].adminArea3 + " (" + formatted.results[0].locations[0].adminArea1 + ")";
          var units = "metric";
          if (formatted.results[0].locations[0].adminArea1 == "US") units = "imperial";
          var lat = formatted.results[0].locations[0].latLng.lat;
          var lng = formatted.results[0].locations[0].latLng.lng;
          request("https://api.openweathermap.org/data/2.5/onecall?appid=" + process.env.OPENWEATHERMAP_KEY + "&lat=" + lat + "&lon=" + lng + "&units=" + units, function cbfunc(error2, response2, body2) {
            //If call returned correctly, continue
            if (!error2 && response2.statusCode == 200) {
              var wdata = JSON.parse(body2);
              if (wdata) {
                var ukMix = false;
                var timeFormat = "HH:mm";
                var twelvehour = {
                  US: true,
                  GB: true,
                  PH: true,
                  CA: true,
                  AU: true,
                  NZ: true,
                  IN: true,
                  EG: true,
                  SA: true,
                  CO: true,
                  PK: true,
                  MY: true
                };
                if (twelvehour[formatted.results[0].locations[0].adminArea1]) timeFormat = "h:mm A";
                if (formatted.results[0].locations[0].adminArea1 == "GB") ukMix = true;
                var tempBoy = "°C";
                if (units == "imperial") tempBoy = "°F";
                var windBoy = "km/h"
                if (units == "imperial" || ukMix) windBoy = "mph";
                var pressureBoy = "hPa";
                if (units == "imperial") pressureBoy = "inHg";
                var visBoy = "km";
                if (units == "imperial" || ukMix) visBoy = "mi";
                var dateFormat = "ddd D/M";
                if (units == "imperial") dateFormat = "ddd M/D";

                // https://openweathermap.org/img/wn/11n@2x.png
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.textAlign = 'left';
                ctx.fillStyle = "#000000";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                //begin current weather box thing
                ctx.fillStyle = getConditionFillColor(wdata.current.temp, units);
                ctx.fillRect(0, 0, 400, 35);
                ctx.fillRect(0, 120, 400, 3);

                //LOCATION
                ctx.textAlign = 'left';
                ctx.fillStyle = "#ffffff";
                ctx.font = '400 18px Open Sans, Helvetica, Arial, sans-serif'
                ctx.fillText(locationStr, 10, 25);

                //LOCAL TIME
                ctx.textAlign = 'right';
                ctx.font = '400 12px Open Sans, Helvetica, Arial, sans-serif'
                ctx.fillText(moment(Date.now()).tz(wdata.timezone).format(timeFormat), 390, 22);

                ctx.textAlign = 'left';
                ctx.fillStyle = "#ffffff";
                // CURRENT TEMP
                var tempBig = Math.round(wdata.current.temp);
                ctx.font = '700 45px Open Sans, Helvetica, Arial, sans-serif';
                var bigtempwidth = ctx.measureText(tempBig).width;
                ctx.fillText(tempBig, 85, 80);
                ctx.font = '400 22px Open Sans, Helvetica, Arial, sans-serif';
                var spaceit = 87 + bigtempwidth;
                bigtempwidth += (87 + ctx.measureText(tempBoy).width + 18);
                ctx.fillText(tempBoy, spaceit, 65);
                //CURRENT STATUS
                ctx.font = '700 22px Open Sans, Helvetica, Arial, sans-serif';
                var statusWidth = ctx.measureText(wdata.current.weather[0].description).width;
                if (statusWidth > 210) {
                  ctx.font = '700 18px Open Sans, Helvetica, Arial, sans-serif';
                  var statusWidth2 = ctx.measureText(wdata.current.weather[0].description).width;
                  if (statusWidth2 > 210) {
                    ctx.font = '700 15px Open Sans, Helvetica, Arial, sans-serif';
                  }
                }
                ctx.fillText(wdata.current.weather[0].description, bigtempwidth, 70);

                //CURRENT DATA LABELS
                ctx.font = '400 italic 11px Open Sans, Helvetica, Arial, sans-serif';
                ctx.fillText('Feels like', 90, 97);
                ctx.fillText('Wind', 90, 113);

                ctx.fillText('Humidity', 190, 97);
                ctx.fillText('Pressure', 190, 113);

                ctx.fillText('Visibility', 300, 97);
                ctx.fillText('UV Index', 300, 113);

                //DATA VALUES NOW
                ctx.font = '400 11px Open Sans, Helvetica, Arial, sans-serif';
                ctx.fillText(Math.round(wdata.current.feels_like) + ' ' + tempBoy, 141, 97); //feels like
                var windSpeed = "N/A";
                if (units == "imperial") {
                  windSpeed = Math.round(wdata.current.wind_speed);
                } else {
                  var kph = 3.6 * wdata.current.wind_speed;
                  var mph = 2.237 * wdata.current.wind_speed;
                  if (ukMix) {
                    windSpeed = Math.round(mph);
                  } else {
                    windSpeed = Math.round(kph);
                  }
                }
                ctx.fillText(windSpeed + ' ' + windBoy, 141, 113); //wind

                ctx.fillText(Math.round(wdata.current.humidity) + "%", 238, 97); //humid
                var presStr = 'N/A';
                if (wdata.current.pressure) {
                  if (units == 'imperial') {
                    presStr = (wdata.current.pressure / 33.86).toFixed(2);
                  } else {
                    presStr = (wdata.current.pressure);
                  }
                  presStr += ' ' + pressureBoy
                }
                ctx.fillText(presStr, 238, 113); //pressure
                var visStr = 'N/A';
                if (wdata.current.visibility) {
                  if (units == "imperial" || ukMix) {
                    visStr = Math.round(wdata.current.visibility / 1609);
                  } else {
                    visStr = Math.round(wdata.current.visibility / 1000);
                  }
                  visStr += ' ' + visBoy;
                }
                ctx.fillText(visStr, 350, 97); //vis
                ctx.fillText(wdata.current.uvi, 350, 113); //uv

                //THREE DAY
                ctx.textAlign = 'center';
                ctx.font = '400 14px Open Sans, Helvetica, Arial, sans-serif';
                ctx.fillText(moment(wdata.daily[0].dt * 1000).tz(wdata.timezone).format(dateFormat), 80, 142);
                ctx.fillText(moment(wdata.daily[1].dt * 1000).tz(wdata.timezone).format(dateFormat), 200, 142);
                ctx.fillText(moment(wdata.daily[2].dt * 1000).tz(wdata.timezone).format(dateFormat), 320, 142);

                ctx.textAlign = 'left';
                ctx.font = '400 italic 11px Open Sans, Helvetica, Arial, sans-serif';
                ctx.fillText('Sunrise: ' + moment(wdata.daily[0].sunrise * 1000).tz(wdata.timezone).format(timeFormat), 40, 200);
                ctx.fillText('Sunset: ' + moment(wdata.daily[0].sunset * 1000).tz(wdata.timezone).format(timeFormat), 40, 215);

                ctx.fillText('Sunrise: ' + moment(wdata.daily[1].sunrise * 1000).tz(wdata.timezone).format(timeFormat), 160, 200);
                ctx.fillText('Sunset: ' + moment(wdata.daily[1].sunset * 1000).tz(wdata.timezone).format(timeFormat), 160, 215);

                ctx.fillText('Sunrise: ' + moment(wdata.daily[2].sunrise * 1000).tz(wdata.timezone).format(timeFormat), 280, 200);
                ctx.fillText('Sunset: ' + moment(wdata.daily[2].sunset * 1000).tz(wdata.timezone).format(timeFormat), 280, 215);

                //BEGIN 3DAY HIGHS AND LOWS
                ctx.textAlign = 'right';
                ctx.font = '700 16px Open Sans, Helvetica, Arial, sans-serif';
                ctx.fillText(Math.round(wdata.daily[0].temp.max) + ' ' + tempBoy, 120, 166);
                ctx.fillText(Math.round(wdata.daily[0].temp.min) + ' ' + tempBoy, 120, 185);

                ctx.fillText(Math.round(wdata.daily[1].temp.max) + ' ' + tempBoy, 240, 166);
                ctx.fillText(Math.round(wdata.daily[1].temp.min) + ' ' + tempBoy, 240, 185);

                ctx.fillText(Math.round(wdata.daily[2].temp.max) + ' ' + tempBoy, 360, 166);
                ctx.fillText(Math.round(wdata.daily[2].temp.min) + ' ' + tempBoy, 360, 185);

                // ICONS ICONS ICONS
                var picboy = new Image();
                picboy.onload = function() {
                  ctx.drawImage(picboy, -7, 30, 100, 100);

                  var picboy2 = new Image();
                  picboy2.onload = function() {
                    ctx.drawImage(picboy2, 25, 142, 60, 60);

                    var picboy3 = new Image();
                    picboy3.onload = function() {
                      ctx.drawImage(picboy3, 145, 142, 60, 60);
                      var picboy4 = new Image();
                      picboy4.onload = function() {
                        ctx.drawImage(picboy4, 265, 142, 60, 60);
                        var img;
                        try {
                          img = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
                        } catch (e) {
                          img = canvas.toDataURL().split(',')[1];
                        }
                        imgur.uploadBase64(img)
                          .then(function(json) {
                            jqbx.sendChat(json.data.link);
                          })
                          .catch(function(err) {
                            console.error(err.message);
                            jqbx.sendChat("imgur upload error...");
                          });
                      };
                      picboy4.onerror = err => {
                        throw err
                      }
                      picboy4.src = 'https://openweathermap.org/img/wn/' + wdata.daily[2].weather[0].icon + '@2x.png';
                    };
                    picboy3.onerror = err => {
                      throw err
                    }
                    picboy3.src = 'https://openweathermap.org/img/wn/' + wdata.daily[1].weather[0].icon + '@2x.png';
                  };
                  picboy2.onerror = err => {
                    throw err
                  }
                  picboy2.src = 'https://openweathermap.org/img/wn/' + wdata.daily[0].weather[0].icon + '@2x.png';
                };
                picboy.onerror = err => {
                  throw err
                }
                picboy.src = 'https://openweathermap.org/img/wn/' + wdata.current.weather[0].icon + '@2x.png';

              } else {
                jqbx.sendChat("E R R O R with my weather sensors!");
              }
            } else {
              jqbx.sendChat("HMMMMMMMMMMMMM RATE LIMIT?");
            }
          });
        } else {
          jqbx.sendChat("where is that? i'm using mapquest idk");
        }
      }
    });
  }
};
