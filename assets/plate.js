// Fills the Nightlight plate motifs. Every lit well follows a real layout (a
// dilution series, a row scan, replicates), seeded so each load draws the same
// plate. Motion lives in styles.css and stops under prefers-reduced-motion.
(function () {
  var seed = 418;
  function rand() {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  }
  function clamp(v) {
    return Math.max(0, Math.min(5, Math.round(v)));
  }
  function well(level, className) {
    var el = document.createElement('span');
    el.className = 'plate-well' + (className ? ' ' + className : '');
    el.setAttribute('data-l', level);
    return el;
  }

  // 16 x 24 dilution: signal falls from column 1 toward 22; the four row groups
  // are replicates at increasing dilution, and columns 23-24 are blanks.
  function dilution(r, c) {
    var steep = [0.24, 0.3, 0.38, 0.5][Math.floor(r / 4)];
    return c >= 22 ? 0 : clamp(5.4 - c * steep + (rand() - 0.5) * 0.8);
  }

  function each(kind, fn) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-plate="' + kind + '"]'), fn);
  }

  // Reader sweep: the plate scans in once, then a read head crosses it and
  // each column flashes as the head passes.
  each('sweep', function (plate) {
    for (var r = 0; r < 16; r++) {
      for (var c = 0; c < 24; c++) {
        var w = well(dilution(r, c), 'plate-well--flash');
        w.style.animationDelay = Math.round(300 + r * 100 + c * 6) + 'ms, ' + (2400 + c * 110) + 'ms';
        plate.appendChild(w);
      }
    }
    var head = document.createElement('span');
    head.className = 'plate-head';
    head.setAttribute('aria-hidden', 'true');
    plate.appendChild(head);
  });

  // Plate scan: wells light row by row, hold, and go dark again.
  each('loopscan', function (plate) {
    for (var r = 0; r < 16; r++) {
      for (var c = 0; c < 24; c++) {
        var w = well(dilution(r, c), 'plate-well--loop');
        w.style.animationDelay = (r * 140 + c * 8) + 'ms';
        plate.appendChild(w);
      }
    }
  });

  // The indicator: one lit well among 383 quiet ones, breathing.
  each('indicator', function (plate) {
    for (var i = 0; i < 384; i++) {
      var lit = i === 7 * 24 + 15;
      plate.appendChild(well(lit ? 5 : 1, lit ? 'plate-well--lit' : ''));
    }
  });

  // The strip: the growth curve drawn as an LED matrix. A read head sweeps
  // left to right (one column per scan step), lighting each column up to the
  // curve; the frame holds, then goes dark in the same order. The inflection
  // is the one lit well.
  each('strip', function (strip) {
    var cols = 102, rows = 12, mid = Math.round((cols - 1) / 2);
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var h = Math.round(1 + (rows - 1) / (1 + Math.exp(-11 * (c / (cols - 1) - 0.5))));
        var y = rows - 1 - r;
        var level = y >= h ? 0 : (y === h - 1 ? 4 : 1);
        var lit = c === mid && y === h - 1;
        var w = well(lit ? 5 : level, level ? 'plate-well--matrix' + (lit ? ' plate-well--lit' : '') : 'plate-well--still');
        if (level) w.style.animationDelay = (c * 30) + 'ms' + (lit ? ', ' + (c * 30 + 400) + 'ms' : '');
        strip.appendChild(w);
      }
    }
  });

  // Post thumbnails: a 4 x 6 plate signature per post.
  each('signature', function (grid) {
    var kind = grid.getAttribute('data-kind');
    for (var r = 0; r < 4; r++) {
      for (var c = 0; c < 6; c++) {
        var v;
        if (kind === 'dilution') v = 5.2 - c * 1.0 + (rand() - 0.5) * 0.8;
        else if (kind === 'diagonal') v = 5 - Math.abs(c - r * 1.6) * 1.6 + (rand() - 0.5) * 0.6;
        else if (kind === 'single') v = (r === 1 && c === 4) ? 5 : 0.4 + rand() * 0.6;
        else if (kind === 'rows') v = (r % 2 === 0 ? 4 : 1.2) + (rand() - 0.5) * 1.2 - c * 0.3;
        else v = 1 + rand() * 3.6;
        grid.appendChild(well(clamp(v), 'plate-well--still'));
      }
    }
  });
})();
