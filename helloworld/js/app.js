APP_ID = '517725432172992162';

var app = MCorp.app(APP_ID, {
    anon: true
});

app.run = function () {
    this.msvs.shared.on("timeupdate", function () {
        $("#ts").html(this.pos.toFixed(3) + " local offset " + (1000 * this.pos - new Date()).toFixed(1) + "ms");
    });
    document.addEventListener('mediascape-ready', app.mediascape);
    if (window.mediascape) {
        app.mediascape();
    }
}

app.mediascape = function () {
    // Resize our layout based on the local screen
    window.mediascape.agentContext.on("screenSize", function (e) {
        $(".capabilities").css("width", e.value[0] - 200 + "px");
    });

    // Function to add or update an agent
    function addAgent(agent) {
        console.log("Adding agent", agent.agentid);
        if ($(".agent#" + agent.agentid).length == 0) {
            console.log("CREATING IT");
            var n = $(".template .agent").clone().attr("id", agent.agentid);
            $("body").append(n);
        }
        // Update capability list
        var $target = $(".agent#" + agent.agentid + ">.capabilities");
        $target.html("");
        var c = agent.capabilities();
        for (var key in c) {
            if (c.hasOwnProperty(key)) {
                $target.append("<div class='capability " + c[key] + "'>" + key + "</div>");
            }
        }
        // Add some state changes too
        if (agent.capabilities().battery === "supported") {
            agent.on("battery", function (key, value) {
                $(".agent#" + agent.agentid + ">.battery").show();
                if (value.charging) {
                    $(".agent#" + agent.agentid + ">.battery img")[0].src = "img/batcharge.jpg";
                    $(".agent#" + agent.agentid + ">.battery>.level").html("");
                } else {
                    if (value.level > 0.3) {
                        $(".agent#" + agent.agentid + ">.battery img")[0].src = "img/batfull.jpg";
                    } else {
                        $(".agent#" + agent.agentid + ">.battery img")[0].src = "img/batempty.jpg";
                    }
                    $(".agent#" + agent.agentid + ">.battery>.level").html((value.level * 100).toFixed(0) + "%");

                }
            });
        }
        if (agent.capabilities().shake === "supported") {
            agent.on("shake", function (key, value) {
                var bg = "white";
                if (value == true) {
                    bg = "green";
                }
                $(".agent#" + agent.agentid).css("background", bg);
            });
        }
        if (agent.capabilities().screenSize === "supported") {
            agent.on("screenSize", function (key, value) {
                var scale = 100 / Math.max(value[0], value[1]);
                var $elem = $(".agent#" + agent.agentid + " .screen");
                $elem.css("width", value[0] * scale + "px");
                $elem.css("height", value[1] * scale + "px");
            });
        }
    }

    function removeAgent(agentid) {
        $(".agent#" + agentid).remove();
    }

    // Connect the application context to the UserApp mapping
    var userID = 'anUser';
    var AgentID = (Math.random() * 999999999).toFixed(0);

    var map = mediascape.mappingService("", {
        userId: userID
    });

    map.getUserMapping(APP_ID, ['userApp']).then(function (data) {
        app.appContext = mediascape.applicationContext(data.userApp, {
            agentid: AgentID,
            autoClean: true,
            userId: userID
        });
        console.log('app.appContext', app.appContext);
        app.appContext.on('agentchange', function (event) {
            if (event.agentContext) {
                addAgent(event.agentContext);
            } else {
                removeAgent(event.agentid);
            }
        });
    }).catch(function (error) {
        // Likely authentication error - redirect it
        var login_url = "" + window.location.href;
        window.location = login_url;
    });
}

window.onload = app.init;
