//Adapted from tutorial at http://www.tnoda.com/blog/2013-12-07

//NB - Transitions in D3 appear to not work easily with adding CSS classes of new styles
//		Instead, am adding the styles via JS direct
//		Todo - tidy/find better way!
var defaultFill = '#c9bad6';
var hoverFill = '#64497b';

//Shim for bind() function, needed for IE8
if (!Function.prototype.bind) {
  Function.prototype.bind = function(oThis) {
    if (typeof this !== 'function') {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function
      throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
    }

    var aArgs   = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        fNOP    = function() {},
        fBound  = function() {
          return fToBind.apply(this instanceof fNOP && oThis
                 ? this
                 : oThis,
                 aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}



//transitions - taken from http://jsfiddle.net/marcfawzi/Zfspb/
;(function() {

    function simulateTransitionEnd(duration) {
        var     el = this
            ,   callback = function() {
                // don't simulate if naturally triggered
                if (!triggered) {
                    $(el).trigger(vendorEndEvent);
                }
            }
        setTimeout(callback, duration + 17)
    }

    d3.vendorStyle = function(prop) {
        var     vendorPrefixes = ['Moz','Webkit','O', 'ms']
            ,   style     = document.createElement('div').style
            ,   upper     = prop.charAt(0).toUpperCase() + prop.slice(1)
            ,   pref, len = vendorPrefixes.length;

        while (len--) {
            if ((vendorPrefixes[len] + upper) in style) {
                pref = (vendorPrefixes[len])
            }
        }
        if (!pref && prop in style) {
            pref = prop
            return perf
        }
        if (pref) {
            return pref + upper
        }
        return ''
    }

    var     endEvent = {
            'WebkitTransition' : 'webkitTransitionEnd',
            'MozTransition'    : 'transitionend',
            'OTransition'      : 'oTransitionEnd otransitionend',
            'msTransition'     : 'MSTransitionEnd',
            'transition'       : 'transitionend'
        }
        ,   vendorEndEvent = endEvent[d3.vendorStyle('transition')]
        ,   defaults = {
            duration: 400,
            easing: 'cubic-bezier(0.250, 0.460, 0.450, 0.940)' /* easeOutQuad */
        }
        ,   triggered = false

    d3.selection.prototype.cssTransition = function(props, opts) {

        var options = $.extend({}, defaults, opts);
        var vendorTransition = d3.vendorStyle('transition')
        props[vendorTransition] = 'all ' + options.duration + 'ms ' + options.easing;

        $(this[0]).one(vendorEndEvent, options.complete || function(){});
        $(this[0]).one(vendorEndEvent, function() {
            triggered = true
        })
        simulateTransitionEnd.bind(this[0])(options.duration);

        $(this).each(function(i, el) {
            $(el).css(props);
        })
        return this
    }

})();



//Set map up

var m_width = $("#interactiveMap").width(),
	width = 700,
	height = 500,
	country,
	state;

var projection = d3.geo.mercator()
	.scale(110)
	.translate([width / 2, height / 1.5]);

var path = d3.geo.path()
	.projection(projection);

var svg = d3.select("#interactiveMap").append("svg")
	.attr("preserveAspectRatio", "xMidYMid")
	.attr("viewBox", "0 0 " + width + " " + height)
	.attr("width", m_width)
	.attr("height", m_width * height / width);

svg.append("rect")
	.attr("class", "background")
	.attr("width", width)
	.attr("height", height)
	.on("click", country_clicked);
   // .on("hover", country_hovered);


var g = svg.append("g");


//Load country data into map, and add event handlers
d3.json("json/countries.topo.json", function(error, us) {
  g.append("g")
	.attr("id", "countries")
	.selectAll("path")
	.data(topojson.feature(us, us.objects.countries).features)
	.enter()
	.append("path")
	.attr("id", function(d) { return d.id; })
	.attr("d", path)
	.on("click", country_clicked)
	.on("mouseover", mouseoverCountry)
	.on("mouseout", mouseoffCountry)
});



//EVENTS

function zoom(xyz) {
  g.transition()
	.duration(750)
	.attr("transform", "translate(" + projection.translate() + ")scale(" + xyz[2] + ")translate(-" + xyz[0] + ",-" + xyz[1] + ")")
	.selectAll(["#countries", "#states", "#cities"])
	.style("stroke-width", 1.0 / xyz[2] + "px");
}

function get_xyz(d) {
  var bounds = path.bounds(d);
  var w_scale = (bounds[1][0] - bounds[0][0]) / width;
  var h_scale = (bounds[1][1] - bounds[0][1]) / height;
  var z = .96 / Math.max(w_scale, h_scale);
  var x = (bounds[1][0] + bounds[0][0]) / 2;
  var y = (bounds[1][1] + bounds[0][1]) / 2 + (height / z / 6);
  return [x, y, z];
}



function loadCountryInfo(countryName) {
	var $panel = $('#interactiveMapPanelContent'),
		panelHtml;

	//Add slashes for countries with ' in
	countryName = countryName.replace(/'/g, "\\'");

	$.ajax({
		url: "ajax/loadCountry.php?country=" + countryName,
		dataType: 'json',
		success: function (data) {
			
			//Remove slashes if country has ' in
			countryName = countryName.replace(/\\'/g, "'");
		
			panelHtml = '<h1>' + countryName + '</h1>';

			if (data === null) {
				//panelHtml += '<p>We are still gathering data on UCL\'s links with this country.</p>';
			} else {


				if (data.strategic_text) {
					panelHtml += '<h2 class="strategy-heading">Strategic</h2>';
					panelHtml += '<p>' + data.strategic_text + '</p>';
				}
				if (data.topical_text) {
					panelHtml += '<h2 class="topical-heading">Topical</h2>';
					panelHtml += '<p>' + data.topical_text + '</p>';
				}
				if (data.historical_text) {
					panelHtml += '<h2 class="historical-heading">Historical</h2>';
					panelHtml += '<p>' + data.historical_text + '</p>';
				}
			}
			$panel.html(panelHtml);
			$panel.find('a').attr('target', '_parent');
		},
		error: function (xhr, status, errorThrown) {
			console.log(xhr.responseText);

		}
	});

}

function country_clicked(d) {

  g.selectAll(["#states", "#cities"]).remove();
  state = null;

  if (country) {
	g.selectAll("#" + country.id).style('display', null);
  }


  if (d && country !== d) {
	var xyz = get_xyz(d);
	country = d;
	zoom(xyz);
  } else {
	var xyz = [width / 2, height / 1.5, 1];
	country = null;
	zoom(xyz);
  }
  
  
  d3.selectAll('path')
  	.classed('active', false)
  	.attr('style', 'rgb(201, 186, 214)');
  d3.select('#' + d.id).classed('active', true);
  //debugger;
  loadCountryInfo(d.properties.name);
}

function mouseoverCountry(d) {
   g.selectAll("#" + d.id)
	.transition()
	.each("start", function () {
		d3.select(this)
			.cssTransition({
				//transform: 'scale(2)'
				fill: hoverFill
			},{
				duration: 200,
				complete: function () {}
			});
	});
}
function mouseoffCountry(d) {
	//debugger;
	
	if (!(g.selectAll('#' + d.id).classed('active'))) {
		g.selectAll("#" + d.id)	
		.transition()
		.each("start", function () {
			d3.select(this)
				.cssTransition({
					//transform: 'scale(2)'
					fill: defaultFill
				},{
					duration: 200,
					complete: function () {}
				});
		});
	}
   
}

$('#countrySelector').change(function () {
	var selection,
		countryName,
		code = $(this).find('option:selected').val();
	g.selectAll('path').classed('active', false);
	
	selection = d3.selectAll("#" + code);
	
	if (selection.empty()) {
		//if map doesn't have our country
		//debugger;
		switch (code) {
			case 'ATG':
				countryName = 'Antigua and Barbuda';
			break;	
			case 'ABW':
				countryName = 'Aruba';
			break;
			case 'BHR':
				countryName = 'Bahrain';
				break;
			case 'BRB':
				countryName = 'Barbados';
				break;
			case 'VAT':
				countryName = 'Holy See';
			break;
			case 'FAR':
				countryName = 'Faroe Islands';
				break;
			case 'GRD':
				countryName = 'Grenada';
				break;
			case 'KIR':
				countryName = 'Kiribati';
				break;	
			case 'LIE':
				countryName = 'Liechtenstein';
				break;				
			case 'MCO':
				countryName = 'Monaco';
			break;
			case 'MLT':
				countryName = 'Malta';
			break;
			case 'KNA':
				countryName = 'Saint Kitts and Nevis';
			break;
			case 'LCA':
				countryName = 'Saint Lucia';
			break;
			case 'VCT':
				countryName = 'Saint Vincent and the Grenadines';
			break;
			case 'SMR':
				countryName = 'San Marino';
			break;
			case 'SYC':
				countryName = 'Seychelles';
			break;
			case 'SLB':
				countryName = 'Solomon Islands';
			break;
			case 'TUV':
				countryName = 'Tuvalu';
			break;
			
		}
		
		//Zoom out
		var xyz = [width / 2, height / 1.5, 1];
		country = null;
		zoom(xyz);
		
		loadCountryInfo(countryName);
		
	} else {	
		selection.each(function(d,i){
			country_clicked(d);
		
			d3.select(this).classed('active', true);
			
		});
	}

	
});

$(window).resize(function() {

  var w = $("#interactiveMap").width();
  svg.attr("width", w);
  svg.attr("height", w * height / width);
});
