(function attachAppGlobals() {
  try {
    var names = [
      'Phone', 'Messages', 'Mail', 'Music', 'Photos', 'Camera', 'Clock', 'Calculator', 'Notes', 'Maps', 'Calendar', 'Settings', 'AppStore',
      'Weather', 'Instagram', 'YouTube', 'Garage', 'Translator', 'Pong', 'FruitNinja', 'Pacman', 'Stack', 'Temple', 'Tuister', 'Bank',
      'Business', 'DarkWeb', 'News', 'BikeRent', 'Uber', 'Crypto', 'BitLove', 'Call'
    ];
    var attached = [];
    for (var i = 0; i < names.length; i++) {
      var n = names[i];
      try {
        if (!window[n]) {
          var v = eval(n);
          if (v && typeof v === 'object') {
            window[n] = v;
            attached.push(n);
          }
        }
      } catch (e) {}
    }
    if (attached.length) {
    }
  } catch (err) {
  }
})();
