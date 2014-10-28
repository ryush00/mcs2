jQuery(function($) {
  var socket = io(), firstConnect = true, lastUpdate = 0, timeOffest = 0, isTraditional = true;
  function $create(elm) {
    return $(document.createElement(elm));
  }
  function calcTime() {
    $("div:visible .add-time").each(function() {
      var t = parseInt($(this).attr("data-timestamp"));
      $(this).text(t ? moment(t + timeOffest).locale(isTraditional ? "zh-tw" : "zh-cn").fromNow() : "-");
    });
  }
  $.ajax("/templates/other_info.mustache").done(function(d) {
    $.Mustache.add("other_info", d);
  });
  $.ajax("/templates/status.mustache").done(function(d) {
    $.Mustache.add("status", d);
  });
  socket.on("connect", function() {
    if(firstConnect) {
      firstConnect = false;
      return;
    }
    socket.emit("reconnected", {
      timeStamp: lastUpdate
    });
    $("#disconnected").fadeOut("fast");
  });
  socket.on("reconnect_attempt", function(times) {
    $("#disconnected").fadeIn("fast");
  });
  socket.on("init", function(data) {
    timeOffset = (new Date().getTime()) - data.timeStamp;
    $("#querybutton").button("reset");
  });
  socket.on("online_count", function(data) {
    $("#onlinecount").text(data.count);
  });
  socket.on("status_update", function(data) {
    if(data) {
      var dname = "#d" + data.hash, $dname = $(dname);
      if($dname.length >= 0) {
        $(dname + " .media-object").attr("src", "/icons/" + data.hash + ".png?t=" + data.lastUpdate);
        $(dname + " .motd").empty().append(
          $create("span").addClass("mccolor").text(data.status.motd)
        );
        $(dname + " .playerinfo").text(data.status.currentPlayers + " / " + data.status.maxPlayers);
        $(dname + " .add-info").mustache("other_info", data, { method: "html" });
        if(data.status && data.status.maxPlayers)
          $dname.fadeIn("medium");
        else
          $dname.fadeOut("medium");
      } else
        $("#slist").mustache("status", data, { method: "append" });
      $(dname + " .mccolor").minecraftFormat();
      lastUpdate = Math.max(lastUpdate, data.lastUpdate);
      if(!isTraditional) $(dname).t2s();
    }
    calcTime();
  });
  socket.on("single_use_status_update", function(data) {
    if(data.status) {
      data.hash += "_"; // The hash must be unique, and it will duplicate with the one in the list.
      $("#dresult").mustache("status", data, { method: "html" });
      $("#dresult .mccolor").minecraftFormat();
      if(!isTraditional) $("#dresult").t2s();
      calcTime();
    } else {
      $("#noresult").fadeIn("fast");
      $("#dresult").empty();
    }
    $("#querybutton").button("reset");
  });
  socket.on("single_use_limit_exceeds", function() {
    $("#limitexceeds").stop().fadeIn("fast").delay(5000).fadeOut("fast");
    $("#querybutton").button("reset");
  });
  $("#requestform").submit(function(e) {
    e.preventDefault();
    $("#querybutton").button("loading");
    $("#noresult").fadeOut("fast");
    socket.emit("request", {
      host: $("#id_host").val(),
      port: parseInt($("#id_port").val(), 10),
      addResult: $("#id_addsuccess").prop("checked")
    });
  });
  $("body").on("click", ".navbar-collapse ul li a", function() {
    $(".navbar-toggle:visible").click();
  }).popover({
    html: true,
    placement: "bottom",
    selector: ".showplayers",
    trigger: "focus",
    container: "body",
    content: function() {
      return $(this).closest(".media").find(".playerdetails").html();
    }
  });
  $("#t2s").click(function(e) {
    e.preventDefault();
    isTraditional = !isTraditional;
    if(isTraditional)
      $("body").s2t();
    else
      $("body").t2s();
    $(this).text(isTraditional ? "简" : "繁");
  });
  $("div:visible .mccolor").minecraftFormat();
  calcTime();
});