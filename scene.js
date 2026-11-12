/* Pepper Hill, live. The logo's pepper tree stands on its hill above the Pacific.
   The light follows the visitor's local time; dragging the sun or moon changes the
   hour, and the tree's canopy leans and sways when brushed with a cursor or finger.
   Falls back to the plain logo if anything fails. */
(function () {
  var root = document.documentElement;
  if (!root.classList.contains("fx")) return;

  var canvas = document.getElementById("scene");
  var ctx = canvas.getContext("2d");
  var logoEl = document.querySelector(".logo");
  var contact = document.getElementById("contact");
  var hint = document.getElementById("hint");
  var loginEl = document.getElementById("login"), loginP = 0;   // loginP: 0 closed, 1 fully open
  var calm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function fail() { cancelAnimationFrame(raf); root.classList.remove("fx"); root.style.cssText = ""; }

  // ---------- palette: brand colors at midday and at night, warmer in between ----------
  var KEYS = ["skyTop", "skyBot", "sea", "isle", "near", "far", "leaf", "leafBack", "trunk", "sun", "berry"];
  var NIGHT = ["#2A2521", "#3B342E", "#342F2C", "#443D38", "#4C6050", "#27332B", "#7D9B7F", "#627F65", "#DCE8D5", "#F1EDE3", "#C9A29C"];
  var BLUE  = ["#26314A", "#7C92B5", "#4E6384", "#455779", "#43605D", "#21323A", "#6E8F88", "#5B7A74", "#17282B", "#F6C9A4", "#C79BA3"];
  var DAWN  = ["#ECE9EC", "#F6DCCB", "#E3DCD6", "#CFCBC8", "#8CA88B", "#2A4635", "#93AF90", "#7C9A7A", "#294634", "#F6C9A4", "#CF8E88"];
  var DAY   = ["#F7F8F3", "#F2F5EC", "#DFE9E1", "#C8D8CC", "#9AB694", "#294634", "#9AB694", "#82A17F", "#294634", "#F2C56E", "#D08F8A"];
  var GOLD  = ["#F7EEDD", "#F3CDA4", "#EBCDAC", "#CDB79C", "#8EA87E", "#243F2E", "#93AC80", "#7A956A", "#243F2E", "#F3B56C", "#D2867C"];
  var DUSK  = ["#5A5360", "#DB9D88", "#8C7C80", "#6C6068", "#506954", "#1E3226", "#6C896E", "#557058", "#1B2E22", "#EE9C74", "#C98F8C"];
  var STOPS = [[0, NIGHT], [4.6, NIGHT], [5.4, BLUE], [6.2, DAWN], [7.6, DAY], [15.8, DAY], [17.3, GOLD], [18.25, DUSK], [19.5, NIGHT], [24, NIGHT]];
  function hex(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
  STOPS.forEach(function (s) { if (typeof s[1][0] === "string") for (var i = 0; i < s[1].length; i++) s[1][i] = hex(s[1][i]); });
  var pal = {}, night = 0, palHour = -1;
  function rgb(c) { return "rgb(" + (c[0] | 0) + "," + (c[1] | 0) + "," + (c[2] | 0) + ")"; }
  function setPalette(h) {
    if (Math.abs(h - palHour) < 0.002) return;
    palHour = h;
    var i = 0; while (i < STOPS.length - 2 && h >= STOPS[i + 1][0]) i++;
    var a = STOPS[i], b = STOPS[i + 1], f = (h - a[0]) / (b[0] - a[0]);
    f = f * f * (3 - 2 * f);
    for (var k = 0; k < KEYS.length; k++) {
      var p = a[1][k], q = b[1][k];
      pal[KEYS[k]] = [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f, p[2] + (q[2] - p[2]) * f];
    }
    night = (a[1] === NIGHT ? 1 - f : 0) + (b[1] === NIGHT ? f : 0);
    if (a[1] === NIGHT && b[1] === NIGHT) night = 1;
    // Lettering and button sit on the near hill: dark ink on a light hill, cream on a dark one.
    var n = pal.near, lum = (0.299 * n[0] + 0.587 * n[1] + 0.114 * n[2]) / 255;
    var light = lum > 0.52;
    root.style.setProperty("--ink", light ? "#233D2C" : "#F1EDE3");
    root.style.setProperty("--ink-deep", light ? "#182B1F" : "#FFFFFF");
    root.style.setProperty("--ground", rgb(n));
    root.style.setProperty("--paper", rgb(pal.skyTop));
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", rgb(pal.skyTop));
  }

  // ---------- geometry ----------
  // Canopy outline traced from the logo: [x, top, bottom] every 4 px of the 720 px artwork.
  var CANOPY = [[121,198,232],[125,174,255],[129,163,259],[133,155,260],[137,150,259],[141,145,253],[145,141,263],[149,138,284],[153,134,290],[157,113,296],[161,98,300],[165,89,303],[169,82,306],[173,77,309],[177,72,312],[181,68,316],[185,65,318],[189,62,319],[193,60,316],[197,58,309],[201,56,300],[205,54,290],[209,53,283],[213,52,285],[217,51,290],[221,51,293],[225,50,292],[229,50,287],[233,50,270],[237,50,259],[241,51,221],[245,51,201],[249,47,196],[253,42,193],[257,38,191],[261,34,190],[265,30,190],[269,26,190],[273,23,190],[277,20,189],[281,18,187],[285,16,183],[289,14,175],[293,12,163],[297,10,193],[301,9,202],[305,8,206],[309,7,207],[313,6,206],[317,6,203],[321,5,195],[325,5,202],[329,5,217],[333,5,221],[337,5,222],[341,5,220],[345,5,214],[349,6,193],[353,6,175],[357,7,181],[361,8,183],[365,9,183],[369,10,182],[373,12,177],[377,13,163],[381,15,148],[385,17,161],[389,19,164],[393,22,165],[397,25,163],[401,28,155],[405,31,191],[409,35,220],[413,40,227],[417,45,229],[421,51,230],[425,57,229],[429,65,225],[433,48,215],[437,47,208],[441,46,205],[445,45,203],[449,44,202],[453,44,201],[457,43,201],[461,43,202],[465,44,206],[469,44,214],[473,44,226],[477,45,246],[481,46,262],[485,48,270],[489,49,276],[493,51,281],[497,53,286],[501,55,291],[505,58,296],[509,62,300],[513,66,303],[517,70,301],[521,76,292],[525,82,283],[529,92,280],[533,114,282],[537,116,290],[541,117,291],[545,119,290],[549,121,283],[553,124,242],[557,127,239],[561,130,254],[565,134,260],[569,139,261],[573,145,260],[577,155,257],[581,172,240]];
  var ART_CX = 352, ART_BASE = 352;                // artwork point that lands on the hill crest

  var touchy = window.matchMedia && matchMedia("(pointer: coarse)").matches;
  var maxDpr = touchy ? 2 : 3, spent = 0, counted = 0;   // phones draw at 2x: sharp enough, and far fewer pixels to move
  var W = 0, H = 0, dpr = 1, s = 1, cx = 0, baseY = 0, hz = 0;
  var hillA = 60, hillS = 400, hillX = 0, sunRx = 0, sunRy = 0, discR = 22;
  function yNear(x) { var d = (x - hillX) / hillS; return baseY + hillA * (1 - Math.exp(-d * d)); }
  function yFar(x) { var d = (x - (hillX + hillS * 0.66)) / (hillS * 0.5); return baseY + hillA * 1.08 - hillA * 1.03 * Math.exp(-d * d); }
  function ax(x) { return cx + (x - ART_CX) * s; }
  function ay(y) { return baseY + (y - ART_BASE) * s; }

  // ---------- the tree: the logo's canopy, moving the way live branches do ----------
  // The canopy is one smooth outline traced from the logo. Under it sit invisible boughs, one every
  // 12 px, each a springy branch fixed at the crown: it leans a little when pushed, its tip trails
  // behind, and it eases back with a couple of soft sways. Neighbours pull on each other, so a push
  // travels through the foliage like a gust instead of parting it.
  var berries = [], stars = [], bones = [];
  function seeded(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  var OUTLINE = new Float32Array([131.1,260.9,133.2,261.1,135.3,260.8,136.3,260.5,138.1,259.1,140.5,255.9,141.7,253.1,143.0,249.0,143.4,248.7,143.7,249.0,144.4,251.4,144.7,254.1,145.3,263.6,145.8,266.0,146.1,271.0,148.1,280.9,148.9,283.5,150.6,287.6,151.3,288.7,152.2,289.6,154.3,291.1,155.4,291.5,156.5,291.8,158.7,291.8,160.7,290.9,161.3,290.5,162.8,288.9,164.0,286.9,165.6,282.5,166.7,278.6,167.3,277.3,167.7,276.9,168.1,277.1,168.7,280.2,169.2,288.2,169.9,292.5,170.2,297.3,170.8,300.0,171.2,303.0,173.8,314.3,175.0,316.8,176.5,318.7,177.4,319.5,179.6,320.6,180.7,320.8,181.9,320.8,183.1,320.5,185.4,319.3,187.3,317.3,189.3,313.0,190.9,305.8,191.8,298.5,192.3,290.8,192.8,288.5,193.2,288.1,193.5,288.4,196.1,294.2,196.8,295.2,198.5,296.8,200.6,297.8,202.6,298.0,204.6,297.5,205.5,297.0,207.9,294.5,209.1,292.1,210.4,287.5,210.9,284.3,211.3,274.4,212.0,265.3,212.1,260.1,212.8,256.3,213.1,253.5,214.6,248.2,215.4,247.9,216.3,249.3,218.7,261.0,220.2,264.8,221.8,267.2,222.7,268.2,224.6,269.6,225.6,269.9,227.8,270.1,229.9,269.8,231.8,269.0,233.5,267.8,235.7,265.2,236.8,263.0,237.9,259.1,238.9,251.5,239.1,248.5,239.8,244.8,240.2,234.6,240.8,229.8,241.2,222.9,241.8,221.1,242.2,214.3,243.9,208.5,244.4,205.1,245.3,202.7,247.3,199.2,249.0,197.2,251.8,194.9,253.7,193.9,255.6,193.4,256.4,193.4,258.7,193.9,260.1,193.8,264.8,191.8,267.2,191.3,268.2,191.3,270.9,191.9,272.7,191.8,274.1,191.5,277.7,190.2,281.2,188.1,282.8,186.9,285.4,184.3,286.8,182.4,289.1,177.4,290.1,174.5,291.3,169.2,292.4,165.3,292.8,164.8,293.1,164.8,293.4,165.3,293.9,167.7,294.1,171.3,294.8,175.0,295.1,180.2,295.7,182.7,296.4,188.9,297.2,192.6,299.0,198.0,300.8,201.8,302.1,203.8,304.3,206.1,307.2,207.6,310.3,207.9,312.3,207.5,314.3,206.6,317.0,204.4,319.3,201.3,321.5,196.0,322.4,192.5,322.9,191.8,323.3,191.8,323.6,192.4,323.9,193.8,324.1,195.7,326.6,209.7,327.5,213.7,328.4,216.1,329.3,217.8,330.8,219.9,333.0,221.8,334.6,222.6,335.5,222.8,337.1,223.0,338.0,222.9,339.7,222.4,341.3,221.5,343.6,219.1,345.3,215.8,346.7,211.6,347.8,207.1,348.9,200.2,350.0,191.3,350.1,187.0,350.9,180.3,351.1,176.4,351.3,175.3,351.7,174.7,352.1,174.6,352.6,175.0,354.6,178.6,355.4,179.7,358.5,182.7,359.6,183.5,362.1,184.6,363.3,184.9,365.4,184.7,369.1,182.9,371.1,181.3,373.7,177.4,374.9,174.9,375.8,172.2,376.3,169.4,377.4,166.7,378.1,165.6,379.0,164.7,381.1,163.2,382.9,161.1,383.7,161.2,386.5,163.7,390.0,165.6,390.8,165.9,392.8,166.0,395.0,165.4,397.1,164.3,398.8,162.4,401.2,158.1,401.6,157.7,402.0,157.7,402.3,158.1,402.5,158.9,402.8,161.7,402.9,166.3,402.3,170.1,402.9,172.5,403.1,176.3,403.5,178.0,404.5,180.8,404.9,184.1,405.0,197.5,405.4,203.5,406.9,208.5,407.2,210.9,407.8,213.1,408.9,219.3,410.3,223.1,410.9,224.3,412.4,226.5,415.2,229.1,417.2,230.2,419.7,230.9,422.1,231.0,423.2,230.8,424.4,230.4,426.6,229.1,427.7,228.2,429.8,225.9,432.2,222.4,433.6,219.0,435.8,212.5,437.1,210.0,438.5,208.5,440.5,206.9,443.0,205.4,446.9,203.7,451.6,202.5,454.6,202.2,456.3,202.3,461.8,203.3,466.0,205.1,468.3,206.6,473.2,211.9,477.0,218.3,477.7,220.7,478.1,225.3,479.4,229.6,479.9,232.6,480.2,243.2,480.7,247.9,481.2,263.1,482.4,271.2,483.2,275.0,484.2,277.7,485.7,280.2,487.4,282.0,488.4,282.7,490.7,283.5,493.1,283.8,494.3,283.7,496.6,283.0,497.6,282.4,499.3,280.7,500.0,279.7,501.4,276.8,502.5,273.8,503.0,273.1,503.4,273.2,503.8,274.2,504.8,280.6,505.1,286.1,505.9,290.1,507.2,300.6,508.5,306.9,509.7,310.7,510.6,312.8,512.1,315.2,514.9,317.6,517.1,318.4,518.2,318.5,520.7,318.2,522.8,317.3,525.0,315.3,526.4,313.5,527.6,311.0,529.8,302.5,530.8,295.4,531.2,287.1,531.4,285.9,531.7,284.8,532.6,283.2,533.0,283.3,533.6,284.2,535.1,287.4,536.6,289.6,537.5,290.4,539.3,291.5,541.3,292.0,544.4,291.4,545.4,290.8,547.9,288.4,548.9,286.3,549.9,283.8,550.9,279.4,551.5,269.8,551.9,267.2,552.2,252.5,552.9,249.4,553.2,245.0,554.3,239.5,554.7,238.2,555.2,237.4,555.7,237.0,556.3,237.2,557.1,239.0,560.2,251.9,561.1,254.6,563.1,258.3,563.9,259.4,565.6,261.0,566.4,261.5,567.6,261.9,569.1,262.1,572.1,262.0,573.3,261.6,575.2,260.2,576.9,258.3,577.7,257.1,578.9,254.6,579.8,251.8,580.8,246.7,582.8,233.1,583.3,225.2,583.8,221.8,584.0,216.1,584.0,202.2,583.9,199.3,583.4,195.1,582.9,183.3,582.1,177.8,581.8,174.2,579.8,162.9,578.2,156.8,575.3,148.7,571.8,142.4,568.7,137.7,566.4,134.8,559.9,128.4,554.0,124.1,550.1,121.7,545.9,119.5,540.8,117.1,536.1,115.3,530.6,113.6,525.8,112.4,517.1,111.2,514.6,111.0,508.7,111.0,504.2,111.3,498.6,112.0,492.0,113.4,488.5,114.4,480.6,117.4,476.2,119.4,466.1,125.6,465.1,126.1,464.5,126.2,464.3,126.0,465.8,123.5,467.1,122.0,471.5,117.8,474.9,114.9,480.5,111.2,483.1,109.7,485.7,108.4,491.0,106.3,496.6,104.4,505.5,102.2,517.5,101.4,527.7,102.1,530.2,102.6,531.1,102.4,531.6,101.8,531.7,100.6,530.7,95.1,528.9,89.6,526.8,84.7,523.6,78.7,521.6,75.6,517.3,69.8,514.4,66.5,511.3,63.4,507.3,59.8,502.1,55.8,500.9,55.1,492.8,50.7,488.7,48.7,486.4,47.8,476.4,44.9,472.8,44.2,469.3,43.9,467.0,43.5,462.8,43.2,458.2,43.2,449.6,44.1,446.4,44.9,442.8,45.3,433.9,48.0,432.8,48.7,432.3,49.4,432.3,50.3,435.6,58.2,436.6,61.4,438.7,68.8,439.5,73.9,440.1,83.7,440.0,91.5,439.7,94.0,439.2,95.0,438.7,95.3,438.2,95.1,437.7,94.3,437.3,93.0,434.9,80.5,432.4,72.3,428.3,62.3,423.6,53.9,414.9,41.5,409.2,34.9,405.9,31.6,401.8,28.0,399.4,26.0,392.8,21.2,385.0,16.7,379.6,14.1,375.2,12.3,366.0,9.1,358.4,7.2,353.0,6.2,342.9,5.0,337.4,4.8,325.3,4.9,321.0,5.1,317.3,5.8,312.6,6.4,307.0,7.5,297.8,10.2,290.3,13.1,283.2,16.7,277.6,20.2,273.3,23.2,269.6,26.0,260.8,34.2,253.5,42.1,248.4,48.9,246.9,50.4,245.0,51.0,238.5,50.1,226.7,50.0,223.4,50.2,219.9,50.8,216.4,51.1,214.6,51.6,210.5,52.3,203.6,54.8,199.1,56.8,193.3,59.8,190.7,61.4,182.3,67.5,177.2,72.3,171.2,79.2,169.8,81.1,165.9,87.5,163.2,93.1,161.3,97.9,159.9,102.1,158.3,107.8,157.1,114.8,157.0,117.1,157.2,118.0,157.7,118.5,158.5,118.7,159.6,118.5,165.0,116.6,170.0,115.2,181.1,113.2,194.1,113.1,200.4,113.9,206.8,115.4,211.6,116.9,214.2,117.8,221.7,121.1,223.9,122.3,228.9,125.5,231.7,127.6,233.4,129.3,234.0,130.6,233.9,130.9,233.4,130.9,231.4,130.3,222.4,126.4,217.5,124.8,211.7,123.4,207.0,122.8,203.9,122.1,186.6,122.1,178.7,123.4,175.2,124.2,169.7,126.0,166.7,127.2,161.8,129.4,155.2,133.2,151.8,135.6,147.5,139.1,141.6,144.9,137.2,150.1,134.1,154.4,130.1,161.6,128.0,166.6,125.5,174.0,124.2,179.3,123.2,184.4,122.8,187.9,122.2,191.0,120.9,204.6,120.9,224.4,121.2,232.3,121.6,234.4,122.2,244.8,123.9,252.6,124.3,253.9,125.5,256.2,126.8,258.1,127.6,258.9,129.3,260.1]);
  var VN = OUTLINE.length / 2, shape = new Float32Array(VN * 2);
  var vA = new Uint16Array(VN), vLeanA = new Float32Array(VN), vLeanB = new Float32Array(VN),
      vTipA = new Float32Array(VN), vTipB = new Float32Array(VN), vArm = new Float32Array(VN), vCrown = new Float32Array(VN);
  var crown = { x: 0, vel: 0 };                     // sideways drift of the top of the central dome, in artwork pixels
  var PARTS = [141, 165, 195, 216, 242, 267, 291, 321, 355, 382, 400, 436, 468, 506, 530, 556];   // notches between the canopy's hanging parts
  var MAX_LEAN = 0.36;                              // radians: as far as a bough will ever bend
  function bend(t) { return Math.pow(t, 1.6); }     // how much of the lean reaches a given depth
  function buildTree() {
    var rnd = seeded(7919), i, lastPart = -1, pace = 1, phase = 0;
    bones = [];
    for (i = 1; i < CANOPY.length; i += 3) {
      var c = CANOPY[i], len = Math.max(12, c[2] - c[1]);
      // Boughs between the same two notches of the canopy's lower edge form one hanging part.
      var part = 0; while (part < PARTS.length && c[0] >= PARTS[part]) part++;
      if (part !== lastPart) { lastPart = part; pace = 0.82 + rnd() * 0.36; phase = rnd() * 6.283; }
      var b = { x: c[0], top: c[1], len: len, lean: 0, vel: 0, tip: 0, tipVel: 0, part: part, phase: phase,
                rate: (4.5 - 0.0042 * len) * pace,  // long boughs sway more slowly; each part keeps its own pace
                fruit: null };
      // Some of the longer boughs carry a cluster of pink peppercorns near the tip.
      if (len > 120 && rnd() < 0.42) {
        var dots = [];
        for (var k = 0, kn = 3 + ((rnd() * 3) | 0); k < kn; k++) dots.push([(rnd() - 0.5) * 18, (rnd() - 0.5) * 18, 1, 0]);   // x, y, growth 0..1, regrow delay
        b.fruit = { at: 0.78 + rnd() * 0.14, dots: dots };
      }
      bones.push(b);
    }
    // Tie each outline point to the two boughs it sits between and to its depth down each of them.
    for (i = 0; i < VN; i++) {
      var q = tie(OUTLINE[i * 2], OUTLINE[i * 2 + 1]);
      vA[i] = q[0]; vLeanA[i] = q[1]; vLeanB[i] = q[2]; vTipA[i] = q[3]; vTipB[i] = q[4]; vArm[i] = q[5]; vCrown[i] = q[6];
    }
    tieLimbs();
    placeTree();
  }
  // Where the outline is right now: each point swings sideways with its two boughs and lifts a touch as it does.
  function pose() {
    for (var i = 0; i < VN; i++) {
      var A = bones[vA[i]], B = bones[vA[i] + 1];
      var dx = A.lean * vLeanA[i] + B.lean * vLeanB[i] + A.tip * vTipA[i] + B.tip * vTipB[i];
      shape[i * 2] = ax(OUTLINE[i * 2] + dx + crown.x * vCrown[i]);
      shape[i * 2 + 1] = ay(OUTLINE[i * 2 + 1] - dx * dx / (2.2 * vArm[i]) + Math.abs(crown.x) * 0.12 * vCrown[i]);
    }
  }
  function canopy() {
    ctx.beginPath(); ctx.moveTo(shape[0], shape[1]);
    for (var i = 2; i < VN * 2; i += 2) ctx.lineTo(shape[i], shape[i + 1]);
    ctx.closePath(); ctx.fill();
  }
  // A spot part-way down a bough, in screen pixels (where its peppercorns hang).
  function boughPoint(b, t, out) {
    var dx = b.lean * b.len * bend(t) + b.tip * b.len * Math.pow(t, 3.2);
    out[0] = ax(b.x + dx); out[1] = ay(b.top + b.len * t - dx * dx / (2.2 * Math.max(30, b.len * t)));
  }
  function placeTree() {
    for (var i = 0; i < bones.length; i++) { bones[i].lean = bones[i].vel = bones[i].tip = bones[i].tipVel = 0; }
    crown.x = crown.vel = 0;
    berries = [];
  }

  // ---------- trunk and canopy outline as vector shapes, traced from the logo ----------
  var TRUNK_D = "M250.8 397.1C249.5 396.8 249 396.1 249 394.8C249 393.8 249.4 393.3 252 390.4C258.3 383.4 257.7 378.2 250.8 381.1C250.2 381.3 249.1 381.7 248.3 381.9C247.5 382.2 246.7 382.4 246.5 382.6C246.2 382.7 245.7 382.9 245.2 383C244.7 383.1 244.1 383.3 243.7 383.4C243.4 383.6 242.5 383.8 241.7 383.9C240.9 384.1 239.8 384.3 239.2 384.5C238.6 384.7 237.3 384.9 236.2 385.1C235.2 385.2 233.8 385.4 233 385.6C232.3 385.7 230.3 385.9 228.6 386C226.9 386.1 225.2 386.2 224.8 386.3C224.3 386.4 223.1 386.6 222 386.8C220.9 386.9 219.1 387.2 218 387.5C216.8 387.8 215.6 388 215.3 388C215 388 214.3 388.2 213.6 388.4C213 388.6 211.9 388.9 211.3 389.1C210.3 389.3 209.6 389.5 207.5 390.4C206.2 391 204.8 391.5 203.6 391.8C203 391.9 202 392.2 201.2 392.5C195.2 394.4 190.8 391.1 195 387.9C195.4 387.5 196.7 386.4 197.9 385.5C200.7 383.2 205.5 380 208.4 378.5C214.3 375.6 218.1 374 221.5 373C222.1 372.8 223.5 372.4 224.6 372C225.7 371.6 227 371.2 227.5 371.1C228 370.9 228.9 370.6 229.4 370.4C229.8 370.2 230.4 370 230.5 370C231.4 370 236.7 367 240.1 364.6C245.7 360.6 252.3 352 255.5 344.5C255.8 343.8 256.5 342.4 257 341.3C257.6 340.3 258 339.2 258 338.9C258 338.6 258.2 338 258.4 337.5C258.7 337 258.9 336.2 259 335.7C259 335.2 259.2 334.4 259.4 334C259.7 333.5 259.9 332.8 260 332.3C260.1 331.8 260.4 331.1 260.6 330.6C260.8 330.1 261 329.6 261 329.5C261 329.4 261.2 328.8 261.5 328.2C261.8 327.7 262 327.2 262 327.1C262 326.8 265.2 320.4 266 319.1C266.4 318.5 267 317.5 267.4 316.8C267.8 316.1 268.8 314.7 269.7 313.7C270.6 312.7 271.8 311.2 272.5 310.4C273.6 308.9 275.5 307.1 277.1 305.9C277.5 305.6 278.5 304.8 279.2 304.2C280.7 303.1 283.8 301 284.1 301C284.2 301 284.5 300.9 284.7 300.7C284.9 300.5 285.8 300 286.6 299.5C288 298.7 288.9 298.2 292.6 296.3C294.2 295.4 294.6 295.2 296.6 294C299.7 292 300.8 291.3 304.5 288.9C305.1 288.5 305.8 288.1 306.1 287.9C306.4 287.8 307.2 287.2 307.9 286.6C308.5 286.1 309.6 285.3 310.2 284.9C312.7 283.3 316.4 279.2 317 277.4C317.2 276.9 317.4 276.3 317.6 276.1C317.8 275.8 317.9 275.1 318 274.2C318.1 273.3 318.3 272.5 318.5 271.9C319.2 270.4 319.2 265.4 318.5 263.9C318.2 263.2 318 262.6 318 262.4C318 261.5 315.5 258.2 314.1 257.2C313.6 256.9 313.1 256.5 312.9 256.4C310.9 255 304.8 254.5 300.2 255.4C299 255.7 297.2 255.9 296.1 256C294.9 256.1 293.4 256.3 292.4 256.6C290.2 257.2 279.9 257.2 278.9 256.6C278.6 256.4 277.8 256.2 277.1 256.1C274.4 255.6 270.8 253 269.5 250.5C269.2 250 268.8 249.4 268.6 249.1C268.1 248.4 267.1 246.5 266.9 246C266.9 245.7 266.6 245.2 266.4 244.9C266.2 244.6 266 244.2 266 244C266 243.9 265.8 243.4 265.5 243C265.2 242.6 265 242.2 265 242.1C265 241.8 263.6 239 263.3 238.7C263.2 238.5 263 238.2 262.8 237.8C262.7 237.5 262.2 236.8 261.7 236.2C261.3 235.7 260.6 234.8 260.2 234.2C259.5 233.2 257.1 230.9 255.9 230.1C255.5 229.9 254.9 229.4 254.4 229C254 228.6 253.3 228.1 252.9 227.9C252.5 227.7 251.8 227.2 251.3 226.8C250.8 226.4 250 225.9 249.6 225.6C249.1 225.3 248.5 224.9 248.2 224.7C247.8 224.4 246.9 223.9 246.1 223.5C245.3 223.1 244.4 222.7 244.2 222.6C243.9 222.4 243.4 222.2 243 222C240.9 221 240.3 220.2 240.6 218.4C240.8 217.8 240.9 216.4 241 215.3C241.4 210.6 242.1 209.5 244.2 210.5C244.8 210.8 245.5 211 245.7 211C246.2 211 247 211.3 249.5 212.4C250.1 212.7 250.8 213 251 213C251.4 213 255.1 214.8 256.1 215.5C256.8 216 258.2 216.8 259.8 217.7C260.3 218 260.9 218.4 261.1 218.5C262.3 219.4 263 218.8 263.8 215.9C264.2 214.5 264 209.3 263.5 207.8C263.2 207 263.1 206.1 263 204.4C262.9 202.5 262.8 201.9 262.5 201.2C262.2 200.7 262.1 199.9 262 198.7C261.9 197.4 261.8 196.9 261.5 196.4C261.2 196 261.1 195.4 261 194.3C260.9 193.4 260.8 192.5 260.7 192.2C260.5 191 260.6 190.9 266.2 190.9C271.8 190.9 271.7 190.9 272 192.2C272.1 192.6 272.3 193.2 272.5 193.5C272.7 193.8 272.9 194.5 273 195C273.1 195.5 273.3 196.3 273.6 196.8C273.8 197.3 274 198.1 274 198.4C274 198.9 274.2 199.4 274.4 199.9C274.8 200.6 274.9 201.1 275 202.4C275.1 203.6 275.2 204.3 275.5 204.9C275.9 205.7 275.9 206 276 210.6C276.1 213.6 276.2 215.6 276.3 216C276.7 217.1 277 219.7 277 221.6C277 223.3 277.1 223.7 277.5 225C277.8 225.8 278 226.8 278 227.1C278 227.4 278.2 228.3 278.5 228.9C278.8 229.6 279 230.3 279 230.4C279 232.2 283 237.1 285.5 238.4C287.2 239.2 292.8 239.3 294.6 238.6C295.3 238.3 296 238.1 297.2 238C298.5 237.9 299.1 237.8 299.7 237.5C300.2 237.2 300.8 237.1 302.2 237C303.5 236.9 304.1 236.8 304.8 236.5C306.9 235.5 319.7 235.5 322 236.5C322.6 236.8 323.3 237 323.5 237C323.9 237 324.6 237.3 327.6 238.8C330.2 240.1 330.8 240.4 331.8 241.2C332.3 241.6 333 242 333.2 242.2C334.6 242.8 339.3 247.6 340 249.1C340.3 249.5 340.8 250.6 341.2 251.4C341.7 252.2 342 253 342 253.1C342 253.2 342.2 253.8 342.5 254.4C342.8 255.1 343 255.7 343 256.3C343 257.5 343.6 258.6 344.3 258.6C344.9 258.7 349 255 352.5 251.2C353.1 250.6 354.5 249.1 355.6 247.9C356.7 246.7 358.1 245.2 358.6 244.4C359.1 243.7 359.9 242.7 360.3 242.2C360.8 241.7 361.3 240.9 361.6 240.4C361.9 240 362.2 239.4 362.4 239.1C362.6 238.8 363 238.1 363.3 237.6C363.8 236.6 364 236.1 364.8 234C365 233.5 365.4 232.7 365.6 232.2C366.3 230.9 367 229 367 228.7C367 228.6 367.2 228 367.5 227.4C367.8 226.9 368 226.2 368 225.9C368 225.6 368.2 224.9 368.5 224.4C368.8 223.8 369 223.2 369 223C369 222.9 369.2 222.3 369.5 221.8C369.8 221.3 370 220.7 370 220.5C370 220.3 370.2 219.6 370.5 219C370.8 218.4 371 217.8 371 217.6C371 217.5 371.2 217 371.5 216.4C371.8 215.9 372 215.3 372 215.1C372 214.9 372.2 214.2 372.5 213.6C372.8 213.1 373 212.4 373 212.2C373 212 373.2 211.3 373.5 210.7C374.2 209 374.3 199.5 373.6 197.4C373.3 196.5 373.1 195.6 373.1 194.3C373 193 372.9 192.2 372.5 191.1C372.2 190.4 372 189.5 372 189.2C372 188.9 371.8 188.1 371.6 187.4C371.4 186.7 371.1 185.7 371 185.2C370.9 184.6 370.7 184 370.6 183.7C370.2 182.9 370.3 182.3 371 181.6C372.2 180.3 374.4 176.3 375.1 174C375.3 173.3 375.6 172.5 375.7 172.1C375.9 171.7 376 171.2 376 171C376 170.8 376.1 170.1 376.3 169.5C376.5 168.9 376.8 167.6 376.9 166.7C377.6 162.5 377.9 162.8 382.6 172.5C383.3 174.1 384 175.6 384.1 175.8C384.1 176.1 384.3 176.5 384.5 176.8C384.7 177 384.9 177.6 385 177.9C385.1 178.2 385.4 178.8 385.6 179.2C385.8 179.6 386 180 386 180.2C386 180.3 386.2 180.7 386.4 181.1C386.6 181.5 386.9 182.2 387 182.6C387.2 183.1 387.4 183.6 387.5 183.7C387.6 183.9 387.9 184.5 388.1 185.2C388.3 185.9 388.7 186.9 388.9 187.5C389.5 189.1 390 189.4 391.2 188.4C391.6 188.1 392.5 187.3 393.3 186.8C394.1 186.2 395.7 184.8 396.8 183.7C399.2 181.4 399.6 181.1 400.8 180.3C401.2 180 401.9 179.5 402.3 179.1C403.7 177.9 404.3 177.9 404.3 179.3C404.3 179.7 404.4 180.8 404.6 181.6C404.7 182.4 404.9 184.5 405 186.2C405.1 188 405.3 190.3 405.5 191.3C405.7 192.4 405.9 194.6 406 196.2C406.1 197.8 406.3 199.4 406.3 199.9C406.6 201.4 406.6 201.7 405.5 203C404.9 203.7 404.3 204.5 404.2 204.8C404 205.2 403.4 205.9 402.9 206.5C402.4 207.1 401.7 208.1 401.3 208.7C401 209.3 400.3 210.2 400 210.8C398.6 212.7 398 213.8 398 213.9C398 214 397.8 214.4 397.6 214.7C397 215.5 395.2 219 395 219.7C394.9 220.1 394.6 220.7 394.4 221.1C394.2 221.4 394 221.9 394 222.2C394 222.4 393.8 223 393.6 223.4C393.3 223.9 393.1 224.8 393 225.4C392.9 226 392.7 226.8 392.5 227.2C392.3 227.6 392.1 228.5 392 229.2C391.9 229.9 391.7 230.9 391.5 231.4C391.3 231.9 391.1 232.8 391 233.5C390.9 234.2 390.7 235.1 390.5 235.6C390.3 236 390.1 237 390 237.7C389.9 238.4 389.7 239.3 389.5 239.8C389.3 240.2 389.1 240.9 389.1 241.3C389 241.7 388.8 242.4 388.6 242.8C388 244.2 389.6 244.5 392.9 243.6C393.9 243.3 395.1 243.1 396.4 243C397.5 242.9 398.7 242.8 399.1 242.7C401.5 242.1 405.9 242.1 408.2 242.7C408.6 242.8 410.4 242.9 412.2 243C414.9 243.1 415.6 243.2 416.3 243.5C417 243.7 417.8 243.9 419.2 244C420.8 244.1 421.5 244.2 422.2 244.5C423.8 245.2 432.5 245.2 433.8 244.5C434.3 244.3 435 244 435.3 243.9C437 243.6 440.5 241 444.6 236.9C446.5 235 448.6 233.1 449.2 232.6C449.8 232.1 450.5 231.5 450.8 231.2C451 230.9 451.7 230.3 452.3 229.8C452.9 229.3 454.4 228 455.6 226.9C456.8 225.8 458.1 224.7 458.6 224.4C459 224.2 459.8 223.6 460.3 223.2C460.8 222.7 461.4 222.3 461.7 222.2C461.9 222.1 462.7 221.6 463.4 221.1C464.2 220.6 465.3 219.9 465.9 219.5C466.6 219.2 467.8 218.4 468.7 217.9C469.5 217.4 470.3 217 470.4 217C470.7 217 471.8 216.5 473.7 215.5C474.8 214.9 475.7 214.9 476.3 215.3C477.1 215.8 478.8 220.2 479 222.3C479.1 223.1 479.2 223.8 479.3 224C479.9 225 479.2 226.2 477.5 226.9C477.2 227.1 476.2 227.6 475.4 228.1C474.5 228.6 473.8 229 473.7 229C473.6 229 473.3 229.2 473 229.5C472.7 229.7 472 230.2 471.5 230.5C471 230.8 470.2 231.4 469.7 231.8C469.2 232.1 468.4 232.7 467.9 232.9C466.6 233.7 457.5 242.8 455.9 245C455.2 246 453.9 247.5 453.1 248.4C452.2 249.4 451.3 250.4 451 250.8C449.8 252.5 443.9 257.8 442 258.8C440.4 259.7 438.4 260.6 437.1 261C436.5 261.1 435.9 261.4 435.6 261.6C434.7 262.2 421.7 262.1 420 261.5C418 260.8 407.2 260.7 404.9 261.4C404.1 261.7 402.7 261.9 401.9 262C400.8 262.1 400.2 262.2 399.6 262.6C399.1 262.8 398.5 263 398.1 263C397.7 263 397 263.2 396.4 263.5C395.9 263.8 395.2 264 395 264C394.8 264 394.1 264.2 393.5 264.5C392.9 264.8 392.3 265 392.2 265C392 265 389.9 265.9 389.1 266.4C388.9 266.5 388.3 266.8 387.8 267C385.4 268.3 383 269.7 382.1 270.5C381.6 270.8 380.7 271.5 380 271.9C378.1 273.2 372.9 278.2 372 279.7C371.9 279.9 371.4 280.7 370.9 281.4C370.4 282.2 369.7 283.3 369.3 284C368.9 284.7 368.4 285.6 368.1 286.1C367.8 286.5 367.4 287.4 367.1 287.9C366.8 288.5 366.4 289.2 366.2 289.4C366 289.7 365.8 289.9 365.8 290C365.8 290.1 365.5 290.6 365.1 291.2C364.7 291.8 364.2 292.6 364 293C363.1 294.8 361.8 296.7 360.5 298.1C356 303 353.5 305.1 350.1 306.9C347.6 308.3 347.2 308.5 345.6 309.5C344.7 310.1 343.6 310.6 343.2 310.8C342.4 311.2 340.1 312.7 338.7 313.8C338.1 314.2 337.3 314.8 336.9 315.1C336.4 315.3 335.7 315.9 335.2 316.3C334.7 316.8 333.6 317.6 332.8 318.1C330.5 319.8 323.2 327.1 321.7 329.4C319.3 332.9 317.4 336 317 337.5C316.9 337.8 316.7 338.3 316.5 338.6C316.3 338.9 316.1 339.4 316 339.8C315.9 340.2 315.7 340.9 315.5 341.2C315.3 341.6 315.1 342.4 315 343.1C314.9 343.9 314.6 345 314.4 345.6C314.1 346.5 314 347.2 314 348.2C314 349 313.9 350.1 313.8 350.7C311.9 366.1 313.7 370.6 325 378.3C331 382.4 332.1 383.3 334.3 385.5C336.5 387.8 337.2 390 336.2 392C335.6 393.1 333.4 393.4 331.3 392.7C330.8 392.5 329.9 392.2 329.3 392C328.6 391.8 328 391.6 327.9 391.5C327.8 391.4 327.3 391.2 326.8 391.1C326.2 390.9 325.2 390.6 324.6 390.4C323.9 390.2 323.1 390 322.8 390C322.5 390 321.5 389.8 320.5 389.6C319.6 389.4 318 389.1 317.1 389C316.2 388.9 314.8 388.7 314 388.5C313.2 388.3 311.8 388.1 310.9 388C310 387.9 308.8 387.7 308.3 387.5C307.7 387.3 306.7 387.1 306.1 387C305.4 386.9 304.5 386.7 303.9 386.5C303.4 386.3 302.3 386.1 301.6 385.9C300.8 385.8 300.1 385.6 300 385.5C298.7 384.8 291 383.9 289.7 384.3C289.3 384.4 288.2 384.6 287.1 384.8C286 384.9 284.4 385.2 283.6 385.5C282.8 385.8 281.8 386 281.5 386.1C281 386.2 279.2 387 278.1 387.6C277.9 387.7 277.3 388 276.8 388.2C275.8 388.7 274 389.7 272.1 390.8C271.1 391.4 267.7 393.2 267.5 393.2C267.4 393.2 266.5 393.6 265.5 394.1C264.4 394.6 263.4 395 263.2 395C263 395 262.2 395.2 261.5 395.5C260.7 395.7 259.7 396 259.1 396.1C258.6 396.1 257.8 396.3 257.3 396.5C256.8 396.7 255.6 396.9 254.7 397C253.7 397.1 252.6 397.2 252.2 397.2C251.9 397.3 251.2 397.2 250.8 397.1Z";
  var trunkPath = new Path2D(TRUNK_D);
  // The logo's trunk stops where the foliage begins. These limbs carry each of its branches on up
  // into the crown at the same weight, with the same blunt cut ends, so trunk and limbs read as one tree.
  // Each: start x,y, two bend points, end x,y, starting width, end width.
  var LIMBS = [[263,229, 238,206, 196,194, 152,160, 13,8.5],   [207,193, 198,172, 194,152, 187,138, 10,7.5],
               [269,219, 268,170, 263,112, 246,60, 12.5,8.5],  [263,126, 268,92, 291,64, 304,30, 10,7],
               [383,201, 376,150, 364,72, 341,24, 15.5,9],     [366,100, 372,72, 387,58, 398,40, 10,7],
               [396,203, 404,156, 422,104, 424,62, 15.5,9],     [413,128, 440,116, 474,140, 508,131, 10,7],
               [457,233, 480,210, 538,192, 559,142, 13.5,8.5], [519,189, 520,172, 514,150, 520,133, 10,7.5]];
  // Each limb is kept as an outline of points so it can sway with the foliage in front of it: fixed
  // where it leaves the trunk, moving fully with the canopy by the time it is up inside the crown.
  // That keeps every limb behind the same patch of leaves, whichever way the canopy leans.
  var limbs = [];
  function follow(y) { var w = (232 - y) / 105; return w <= 0 ? 0 : w >= 1 ? 1 : w * w * (3 - 2 * w); }
  LIMBS.forEach(function (L, k) {
    var N = 36, left = [], right = [], i;
    for (i = 0; i <= N; i++) {
      var t = i / N, u = 1 - t;
      var x = u * u * u * L[0] + 3 * u * u * t * L[2] + 3 * u * t * t * L[4] + t * t * t * L[6];
      var y = u * u * u * L[1] + 3 * u * u * t * L[3] + 3 * u * t * t * L[5] + t * t * t * L[7];
      var dx = u * u * (L[2] - L[0]) + 2 * u * t * (L[4] - L[2]) + t * t * (L[6] - L[4]);
      var dy = u * u * (L[3] - L[1]) + 2 * u * t * (L[5] - L[3]) + t * t * (L[7] - L[5]);
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      // A slow swell along the limb, like the brushed strokes of the logo's own branches.
      var w = (L[8] + (L[9] - L[8]) * t) * (1 + 0.09 * Math.sin(t * 5.2 + k * 1.9)) / 2;
      left.push(x - dy / d * w, y + dx / d * w, x, y); right.unshift(x + dy / d * w, y - dx / d * w, x, y);
    }
    // Per point: its outline position, then the spot on the limb's centre line that it moves with.
    var all = left.concat(right), n = all.length / 4;
    limbs.push({ n: n, rest: new Float32Array(all), ties: null, live: new Float32Array(n * 2),
                 rootX: L[0], rootY: L[1], rootR: L[8] * (1 + 0.09 * Math.sin(k * 1.9)) / 2 });
  });
  // How far a spot in the canopy has moved from rest, in artwork pixels.
  function tie(x, y) {
    var first = bones[0].x, pitch = bones[1].x - bones[0].x, last = bones.length - 1;
    var u = (x - first) / pitch, a = Math.max(0, Math.min(last - 1, Math.floor(u)));
    var f = Math.max(0, Math.min(1, u - a)), A = bones[a], B = bones[a + 1];
    var tA = Math.max(0, Math.min(1, (y - A.top) / A.len)), tB = Math.max(0, Math.min(1, (y - B.top) / B.len));
    var cxn = (x - 335) / 105, cyn = Math.max(0, 1 - (y - 5) / 230);
    return [a, A.len * bend(tA) * (1 - f), B.len * bend(tB) * f, A.len * Math.pow(tA, 3.2) * (1 - f), B.len * Math.pow(tB, 3.2) * f,
            Math.max(30, A.len * tA * (1 - f) + B.len * tB * f), Math.exp(-cxn * cxn) * Math.pow(cyn, 1.3)];
  }
  function tieLimbs() {
    for (var k = 0; k < limbs.length; k++) {
      var L = limbs[k]; L.ties = [];
      for (var i = 0; i < L.n; i++) {
        var q = tie(L.rest[i * 4 + 2], L.rest[i * 4 + 3]), w = follow(L.rest[i * 4 + 3]);
        for (var m = 1; m < 5; m++) q[m] *= w;
        q[6] *= w; L.ties.push(q);
      }
    }
  }
  function poseLimbs() {
    for (var k = 0; k < limbs.length; k++) {
      var L = limbs[k];
      for (var i = 0; i < L.n; i++) {
        var q = L.ties[i], A = bones[q[0]], B = bones[q[0] + 1];
        var dx = A.lean * q[1] + B.lean * q[2] + A.tip * q[3] + B.tip * q[4];
        L.live[i * 2] = L.rest[i * 4] + dx + crown.x * q[6];
        L.live[i * 2 + 1] = L.rest[i * 4 + 1] - dx * dx / (2.2 * q[5]);
      }
    }
  }
  function fillLimbs() {              // drawn in artwork coordinates, under the caller's transform
    for (var k = 0; k < limbs.length; k++) {
      var L = limbs[k], v = L.live;
      ctx.beginPath(); ctx.moveTo(v[0], v[1]);
      for (var i = 2; i < L.n * 2; i += 2) ctx.lineTo(v[i], v[i + 1]);
      ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(L.rootX, L.rootY, L.rootR, 0, 6.2832); ctx.fill();   // rounded root, buried in the trunk
    }
  }
  var FOOT_X = 278, FOOT_Y = 378;   // where the trunk meets the ground, in artwork coordinates

  // ---------- layout ----------
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var r = logoEl.getBoundingClientRect();
    cx = W / 2;
    baseY = r.top - Math.max(40, Math.min(72, H * 0.075));
    s = Math.max(0.28, Math.min(1.5, (baseY - Math.max(34, H * 0.07)) / 350, W * (W < 700 ? 0.8 : 0.95) / 470));
    hillA = Math.max(30, Math.min(84, H * 0.085));
    hillS = Math.max(W * 0.4, 330 * s);
    hillX = cx - 62 * s;
    hz = baseY + hillA * 0.16;
    discR = Math.max(20, Math.min(36, Math.min(W, H) * 0.047));
    sunRx = Math.min(W * 0.43, W / 2 - discR - 14);
    sunRy = hz - Math.max(discR + 18, H * 0.075);
    var rnd = seeded(104729);
    stars = [];
    // The client login form sits in the middle of the canopy (or mid-screen when the tree is too small to hold it).
    if (loginEl) {
      loginEl.style.setProperty("--lw", Math.round(Math.max(232, Math.min(300, 330 * s))) + "px");
      loginEl.style.setProperty("--lx", Math.round(ax(352)) + "px");
      loginEl.style.setProperty("--ly", Math.round(H < 520 ? H / 2 : Math.max(130, Math.min(H - 130, ay(160)))) + "px");
    }
    for (var i = 0, n = Math.round(W * hz / 9000); i < n; i++) stars.push([rnd() * W, rnd() * hz * 0.96, 0.5 + rnd() * 0.9, rnd() * 6.283]);
    placeTree();
  }

  // ---------- time ----------
  var hour = 12, manual = false, idle = 0, ret = null;
  function clockHour() { var d = new Date(); return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600; }
  // The sun is the hour hand of a 24-hour clock whose centre sits on the horizon: straight up at
  // noon, on the horizon to the right at 6 PM, straight down (out of sight) at midnight, on the horizon
  // to the left at 6 AM. It turns at an even rate. The moon is always exactly opposite it.
  function isNight(h) { return h >= 18 || h < 6; }
  function body(which) {
    var a = ((which ? hour - 18 : hour - 6) + 24) % 24 / 12 * Math.PI;   // 0 at the left horizon, half a turn at the right
    if (a > Math.PI * 1.5) a -= Math.PI * 2;
    return { a: a, x: cx - Math.cos(a) * sunRx, y: hz - Math.sin(a) * sunRy, up: a > -0.2 && a < Math.PI + 0.2 };
  }

  // ---------- input ----------
  var ptr = { x: -1e4, y: -1e4, lx: -1e4, ly: -1e4, on: false, fresh: false };
  var drag = -1, hover = -1, didDrag = false;
  function overBody(x, y) {
    var reach = Math.max(discR * 2.1, 46);
    for (var w = 0; w < 2; w++) {
      var b = body(w);
      if (b.up && b.y < hz + discR * 0.6 && Math.abs(b.x - x) < reach && Math.abs(b.y - y) < reach) return w;
    }
    return -1;
  }
  function hintDone() {}
  var grabOffset = 0;
  function skyAngle(x, y) {           // the direction of a point from the clock's centre, measured the same way as the light's own angle
    return Math.atan2((hz - y) / sunRy, (cx - x) / sunRx);
  }
  function onMove(e) {
    var x = e.clientX, y = e.clientY;
    idle = 0; ret = null;
    if (drag >= 0) {
      // Dragging turns the clock hand. It follows the pointer all the way round, including below the
      // horizon where the light itself is out of sight, and keeps the offset it was grabbed with so the
      // time never jumps. One full turn is exactly 24 hours.
      var a = skyAngle(x, y) + grabOffset;
      hour = (((drag ? 18 : 6) + a / Math.PI * 12) % 24 + 24) % 24;
      manual = true;
      if (!didDrag) { didDrag = true; hintDone(); }
      return;
    }
    if (!ptr.on || !ptr.fresh) { ptr.lx = x; ptr.ly = y; }
    ptr.x = x; ptr.y = y; ptr.on = true; ptr.fresh = true;
    if (e.pointerType === "mouse") { hover = overBody(x, y); canvas.parentNode.style.cursor = hover >= 0 ? "grab" : ""; }
  }
  function onDown(e) {
    idle = 0; ret = null;
    if (e.target.closest && e.target.closest("a, button, form")) return;
    var w = overBody(e.clientX, e.clientY);
    if (w >= 0) {
      drag = w; grabOffset = body(w).a - skyAngle(e.clientX, e.clientY);
      document.body.style.cursor = "grabbing"; e.preventDefault(); return;
    }
    ptr.x = ptr.lx = e.clientX; ptr.y = ptr.ly = e.clientY; ptr.on = true; ptr.fresh = false;
    gust(e.clientX, e.clientY);
  }
  function onUp(e) {
    if (drag >= 0) { drag = -1; document.body.style.cursor = ""; }
    if (!e || e.pointerType !== "mouse") { ptr.on = false; ptr.fresh = false; }
  }
  function gust(x, y) {
    // A tap sends a soft puff outward through the foliage.
    var R = 120 * s + 30;
    for (var i = 0; i < bones.length; i++) {
      var b = bones[i], dx = ax(b.x) - x, dy = ay(b.top + b.len * 0.6) - y;
      b.vel += (dx < 0 ? -1 : 1) * 0.5 * Math.exp(-(dx * dx + dy * dy) / (R * R));
    }
  }
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onDown);
  window.addEventListener("pointerup", onUp, { passive: true });
  window.addEventListener("pointercancel", onUp, { passive: true });
  window.addEventListener("blur", function () { onUp(); });
  document.addEventListener("pointerleave", function () { ptr.on = false; ptr.fresh = false; });

  // ---------- simulation ----------
  function dropFruit(b, x, y, vx) {
    var f = b.fruit;
    for (var k = 0; k < f.dots.length; k++) {
      var d = f.dots[k];
      if (d[2] < 0.5) continue;
      d[2] = 0; d[3] = Math.random() * 9.6;       // each berry picks its own moment to come back
      if (berries.length > 160) berries.shift();
      berries.push({ x: x + d[0] * s, y: y + d[1] * s, vx: vx * 0.6 + (Math.random() - 0.5) * 1.4,
                     vy: -Math.random() * 1.1, r: (2.3 + Math.random() * 0.8) * Math.max(0.7, s), rest: 0, a: 1 });
    }
  }
  var spot = [0, 0];
  function step(t, dt) {
    var i, k, n = bones.length;
    // How fast the pointer is moving sideways, in artwork pixels per second. Speed is capped, so a
    // flick pushes no harder than a firm, steady sweep.
    var push = 0;
    if (ptr.on && ptr.fresh && loginP < 0.5) push = Math.max(-1300, Math.min(1300, (ptr.x - ptr.lx) / s / Math.max(dt, 0.008)));
    var reachX = 46 * s + 14, sub = dt > 0.02 ? 2 : 1, h = dt / sub;
    for (var pass = 0; pass < sub; pass++) {
      var prev = bones[0].lean, prevPart = bones[0].part;
      for (i = 0; i < n; i++) {
        var b = bones[i], nx = i < n - 1 ? bones[i + 1] : b;
        // Boughs of the same hanging part hold together firmly; separate parts only tug on each other lightly.
        var pull = (b.part === prevPart ? 70 : 9) * (prev - b.lean) + (b.part === nx.part ? 70 : 9) * (nx.lean - b.lean);
        prev = b.lean; prevPart = b.part;
        var force = 0;
        if (!calm) force += 0.3 * Math.sin(t * 0.9 + b.phase) + 0.22 * Math.sin(t * 0.37 + b.x * 0.004) + 0.1 * Math.sin(t * 1.7 + b.phase * 2.3);
        if (push) {
          // Only boughs near the pointer feel it, and a push near the tip has more leverage than one at the crown.
          var dxp = (ax(b.x) - ptr.x) / reachX, depth = (ptr.y - ay(b.top)) / (b.len * s);
          var near = Math.exp(-dxp * dxp), over = depth < -0.12 ? depth + 0.12 : depth > 1.15 ? depth - 1.15 : 0;
          force += 0.0125 * push * near * Math.exp(-over * over * 30) * (0.45 + 0.55 * Math.max(0, Math.min(1, depth)));
        }
        var w = b.rate;
        b.vel += (force - w * w * b.lean - 0.36 * w * b.vel + pull) * h;
        b.lean += b.vel * h;
        if (b.lean > MAX_LEAN) { b.lean = MAX_LEAN; if (b.vel > 0) b.vel *= 0.2; }
        else if (b.lean < -MAX_LEAN) { b.lean = -MAX_LEAN; if (b.vel < 0) b.vel *= 0.2; }
        // The leafy tip trails the bough and settles a little later.
        b.tipVel += (-1.0 * b.vel * w - 72 * b.tip - 4.4 * b.tipVel) * h;
        b.tip += b.tipVel * h;
        if (b.tip > 0.16) b.tip = 0.16; else if (b.tip < -0.16) b.tip = -0.16;
      }
      // Neighbours can differ, but only so far: the canopy stretches between parts and never tears.
      for (i = 0; i < n - 1; i++) {
        var gap = bones[i + 1].lean - bones[i].lean, most = bones[i].part === bones[i + 1].part ? 0.03 : 0.13;
        if (gap > most || gap < -most) {
          var fix = (gap - (gap > 0 ? most : -most)) / 2;
          bones[i].lean += fix; bones[i + 1].lean -= fix;
        }
      }
    }
    // The crown of the central dome: a slow sway in the breeze, and it gives a little when pushed near the top.
    var cf = calm ? 0 : 26 * Math.sin(t * 0.62 + 0.8) + 15 * Math.sin(t * 1.43);
    if (push) {
      var cdx = (ptr.x - ax(335)) / (130 * s), cdy = (ptr.y - ay(70)) / (120 * s);
      cf += 0.5 * push * Math.exp(-cdx * cdx - cdy * cdy);
    }
    crown.vel += (cf - 7.3 * crown.x - 1.5 * crown.vel) * dt;
    crown.x += crown.vel * dt;
    if (crown.x > 15) crown.x = 15; else if (crown.x < -15) crown.x = -15;
    for (i = 0; i < n; i++) {
      var fr = bones[i].fruit;
      if (!fr) continue;
      var speed = bones[i].vel * bones[i].len * bend(fr.at);      // artwork pixels per second at the cluster
      if (speed > 60 || speed < -60) { boughPoint(bones[i], fr.at, spot); dropFruit(bones[i], spot[0], spot[1], speed * s / 60); }
      // Peppercorns return while the page sits untouched: one by one from 20 seconds, all back by 30.
      for (k = 0; k < fr.dots.length; k++) {
        var dot = fr.dots[k];
        if (dot[2] === 0) { if (idle - 20 > dot[3]) dot[2] = 0.001; }
        else if (dot[2] < 1) dot[2] = Math.min(1, dot[2] + dt / 0.38);
      }
    }
    ptr.lx = ptr.x; ptr.ly = ptr.y;

    for (i = berries.length - 1; i >= 0; i--) {
      var b = berries[i];
      b.vy += 0.32; b.x += b.vx; b.y += b.vy;
      var gy = yNear(b.x) - b.r;
      if (b.y >= gy) {
        var m = (yNear(b.x + 1) - yNear(b.x - 1)) / 2, hit = b.vy - b.vx * m;
        b.y = gy;
        var vt = (b.vx + b.vy * m) / (1 + m * m);
        b.vx = vt * 0.965 + 0.3 * m / (1 + m * m);
        b.vy = b.vx * m - (hit > 2.2 ? hit * 0.32 : 0);
        if (Math.abs(b.vx) < 0.06) b.rest += dt; else b.rest = 0;
      }
      if (idle > 20) b.a -= dt * 0.4;
      if (b.a <= 0 || b.x < -20 || b.x > W + 20) berries.splice(i, 1);
    }
  }

  // ---------- drawing ----------
  var ISLE = [0, 0, 0.07, 0.3, 0.17, 0.72, 0.3, 1, 0.42, 0.74, 0.55, 0.9, 0.7, 0.52, 0.86, 0.2, 1, 0];
  function island(x, w, h) {
    ctx.beginPath(); ctx.moveTo(x, hz + 1);
    for (var i = 2; i < ISLE.length - 2; i += 2) {
      var mx = x + (ISLE[i] + ISLE[i + 2]) / 2 * w, my = hz - (ISLE[i + 1] + ISLE[i + 3]) / 2 * h;
      ctx.quadraticCurveTo(x + ISLE[i] * w, hz - ISLE[i + 1] * h, mx, my);
    }
    ctx.lineTo(x + w, hz + 1); ctx.closePath(); ctx.fill();
  }
  function hill(fn) {
    ctx.beginPath(); ctx.moveTo(0, H);
    for (var x = 0; x <= W + 8; x += 8) ctx.lineTo(x, fn(x));
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  }
  // The moon's real phase for today's date: 0 is new, 0.5 is full. Counted from a known new moon
  // (6 Jan 2000, 18:14 UTC) at the moon's average cycle of 29.53 days, which is right to within about a day.
  function moonPhase() {
    var p = ((Date.now() / 86400000 - 10962.7597) / 29.530588853) % 1;
    return p < 0 ? p + 1 : p;
  }
  // Around the new moon the real crescent is too thin to see, so the drawn one never gets thinner
  // than a clear sliver (about what the moon shows three days from new).
  var phase = Math.max(0.11, Math.min(0.89, moonPhase())), lit = (1 - Math.cos(phase * 6.2832)) / 2;   // lit: the share of the disc in sunlight
  // The sunlit part of the moon: the bright limb on one side, closed by the curved edge of the shadow.
  function moonShape(x, y, r) {
    var waxing = phase < 0.5, edge = Math.cos(phase * 6.2832) * r, side = waxing ? 1 : -1;   // lit on the right while waxing (northern sky)
    ctx.beginPath();
    ctx.arc(x, y, r, -Math.PI / 2, Math.PI / 2, !waxing);
    ctx.ellipse(x, y, Math.abs(edge), r, 0, Math.PI / 2, -Math.PI / 2, (edge > 0) === waxing);
    ctx.closePath();
  }
  function disc(b, color, glow, which, t) {
    if (!b.up) return;
    var r = discR * (drag === which ? 1.12 : hover === which ? 1.07 : 1);
    var c = (color[0] | 0) + "," + (color[1] | 0) + "," + (color[2] | 0);
    // Until someone has moved the light, rings ripple out from it to show it can be grabbed.
    if (!didDrag && !calm && Math.sin(b.a) > 0.02) {
      ctx.strokeStyle = "rgb(" + c + ")"; ctx.lineWidth = 1.5;
      for (var k = 0; k < 2; k++) {
        var ph = (t * 0.42 + k * 0.5) % 1;
        ctx.globalAlpha = (1 - ph) * 0.7;
        ctx.beginPath(); ctx.arc(b.x, b.y, discR * (1.15 + ph * 1.5), 0, 6.2832); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    var gr = ctx.createRadialGradient(b.x, b.y, r * 0.6, b.x, b.y, r * 3.4);
    gr.addColorStop(0, "rgba(" + c + "," + glow + ")");
    gr.addColorStop(1, "rgba(" + c + ",0)");
    ctx.fillStyle = gr; ctx.fillRect(b.x - r * 3.5, b.y - r * 3.5, r * 7, r * 7);
    if (which === 1) {
      // The moon: its dark side shows faintly, its sunlit part in full.
      ctx.fillStyle = "rgba(" + c + ",0.22)"; ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, 6.2832); ctx.fill();
      ctx.fillStyle = "rgb(" + c + ")"; moonShape(b.x, b.y, r); ctx.fill();
      return;
    }
    ctx.fillStyle = "rgb(" + c + ")"; ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, 6.2832); ctx.fill();
  }
  // The tree's shadow falls toward the viewer and swings away from the light.
  function shadow(b, strength) {
    var alt = Math.sin(b.a);
    if (!b.up || alt < 0.03) return;
    var up = Math.max(1, hz - b.y), fx = ax(FOOT_X), fy = ay(FOOT_Y);
    var lean = Math.max(-3.4, Math.min(3.4, (fx - b.x) / (up + 26 * s)));
    var flat = 0.2 + 0.12 * (1 - Math.min(1, up / sunRy));
    // One flat tone, so overlapping branches don't darken each other.
    var n = pal.near, k = 0.18 * strength * Math.min(1, (alt - 0.03) / 0.16);
    var tone = rgb([n[0] + (18 - n[0]) * k, n[1] + (34 - n[1]) * k, n[2] + (24 - n[2]) * k]);
    ctx.save();
    ctx.beginPath(); ctx.moveTo(0, H);
    for (var x = 0; x <= W + 8; x += 8) ctx.lineTo(x, yNear(x));
    ctx.lineTo(W, H); ctx.closePath(); ctx.clip();
    ctx.translate(fx, fy); ctx.transform(1, 0, -lean, -flat, 0, 0); ctx.translate(-fx, -fy);
    ctx.fillStyle = tone; canopy();     // the same swaying canopy, laid over on the ground
    ctx.translate(ax(0), ay(0)); ctx.scale(s, s);
    ctx.fillStyle = tone;
    fillLimbs(); ctx.fill(trunkPath, "evenodd");
    ctx.restore();
  }
  // ---------- naming the light ----------
  function lightName(h) {
    return h < 4.95 ? "Night" : h < 5.8 ? "Blue hour" : h < 6.7 ? "Dawn" : h < 10.5 ? "Morning" : h < 14 ? "Midday" : h < 16.3 ? "Afternoon" :
           h < 17.85 ? "Golden hour" : h < 18.5 ? "Sunset" : h < 19.6 ? "Dusk" : "Night";
  }
  function clockText(h) {
    var m = Math.round(h * 60) % 1440, hh = (m / 60) | 0, mm = m % 60;
    return ((hh + 11) % 12 + 1) + ":" + (mm < 10 ? "0" : "") + mm + (hh < 12 ? " AM" : " PM");
  }
  window.pepperHillLight = function () { return manual ? { time: clockText(hour), name: lightName(hour) } : null; };
  var labelA = 0, labelBody = 0, labelHold = 0;
  function label(dt) {
    if (drag >= 0) { labelBody = drag; labelHold = 2.6; } else if (hover >= 0) { labelBody = hover; labelHold = Math.max(labelHold, 0.4); }
    labelHold -= dt;
    labelA += ((labelHold > 0 ? 1 : 0) - labelA) * Math.min(1, dt * 7);
    if (labelA < 0.02) return;
    // From dawn until the sun is down the readout sits with the sun, otherwise with the moon.
    var b = body(hour >= 5.8 && hour < 18.5 ? 0 : 1);
    var text = clockText(hour) + "  \u00B7  " + lightName(hour);
    ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "Segoe UI", Roboto, Arial, sans-serif';
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    var w = ctx.measureText(text).width, y = b.y + discR + 24;
    ctx.textAlign = "center";
    if (y > hz - 12) y = Math.min(b.y - discR - 22, hz - 18);
    var x = Math.max(w / 2 + 14, Math.min(W - w / 2 - 14, b.x));
    var c = pal.skyTop, lightSky = (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255 > 0.55;
    ctx.globalAlpha = labelA; ctx.fillStyle = lightSky ? "#233D2C" : "#F1EDE3";
    ctx.fillText(text, x, y);
    ctx.globalAlpha = 1;
  }
  // Until the light has been moved, "drag me" rides the ripples around it.
  function prompt(t) {
    if (didDrag || drag >= 0) return;
    var b = body(isNight(hour) ? 1 : 0);
    if (!b.up || Math.sin(b.a) < 0.02) return;
    var ph = calm ? 0.3 : (t * 0.42) % 1, text = "drag me", size = Math.max(12, discR * 0.52);
    var R = discR * (1.42 + ph * 0.5) + size * 0.35, below = b.y - discR * 2.1 - size * 1.4 < 4;
    var c = pal.skyTop, lightSky = (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255 > 0.55;
    ctx.font = "600 " + size + 'px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "Segoe UI", Roboto, Arial, sans-serif';
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = lightSky ? "#233D2C" : "#F1EDE3";
    ctx.globalAlpha = calm ? 0.9 : Math.min(1, ph * 5) * Math.min(1, (1 - ph) * 2.4);
    var gap = size * 0.16, total = -gap, i, w;
    for (i = 0; i < text.length; i++) total += ctx.measureText(text[i]).width + gap;
    var along = -total / 2;
    for (i = 0; i < text.length; i++) {
      w = ctx.measureText(text[i]).width;
      var m = (along + w / 2) / R, th = below ? Math.PI / 2 - m : -Math.PI / 2 + m;
      ctx.save();
      ctx.translate(b.x + Math.cos(th) * R, b.y + Math.sin(th) * R);
      ctx.rotate(below ? th - Math.PI / 2 : th + Math.PI / 2);
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
      along += w + gap;
    }
    ctx.globalAlpha = 1;
  }
  function glitter(b, color, t) {
    var alt = Math.sin(b.a);
    if (alt < -0.05) return;
    var depth = Math.min(hillA * 1.1, H - hz), strength = 0.75 - Math.max(0, alt) * 0.4;
    ctx.fillStyle = rgb(color);
    for (var j = 0; j < 7; j++) {
      var y = hz + 4 + j * depth / 8;
      var w = (discR * 0.7 + j * discR * 0.34) * (calm ? 0.85 : 0.7 + 0.3 * Math.sin(t * 2.1 + j * 1.9));
      ctx.globalAlpha = strength * (1 - j / 9);
      ctx.fillRect(b.x - w + (calm ? 0 : Math.sin(t * 1.2 + j) * 3), y, w * 2, Math.max(1.5, 2.2 * s));
    }
    ctx.globalAlpha = 1;
  }
  // When the login form is open the canopy fills in behind it: one soft leaf-green shape that closes
  // the gaps in the foliage, so the form always sits on leaves while the tree keeps its own outline.
  function clearing() {
    if (loginP < 0.01 || !loginEl) return;
    var r = loginEl.getBoundingClientRect();
    if (!r.width) return;
    var e = loginP * loginP * (3 - 2 * loginP), pad = 16;
    var w = (r.width + pad * 2) * e, h = (r.height + pad * 2) * e, l = r.left + r.width / 2 - w / 2, tp = r.top + r.height / 2 - h / 2;
    var rad = Math.min(54, w / 2, h / 2);
    ctx.fillStyle = rgb(pal.leaf);
    ctx.beginPath();
    ctx.moveTo(l + rad, tp);
    ctx.arcTo(l + w, tp, l + w, tp + h, rad); ctx.arcTo(l + w, tp + h, l, tp + h, rad);
    ctx.arcTo(l, tp + h, l, tp, rad); ctx.arcTo(l, tp, l + w, tp, rad);
    ctx.closePath(); ctx.fill();
  }
  // A refused login: the canopy gives one slow shake, like a head saying no.
  window.addEventListener("pepperhill:denied", function () {
    if (calm) return;
    for (var i = 0; i < bones.length; i++) bones[i].vel += 0.85;
    crown.vel += 34;
  });
  function draw(t, dt) {
    var sky = ctx.createLinearGradient(0, 0, 0, hz);
    sky.addColorStop(0, rgb(pal.skyTop)); sky.addColorStop(1, rgb(pal.skyBot));
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, hz + 1);

    if (night > 0.02) {
      ctx.fillStyle = "#F1EDE3";
      for (var i = 0; i < stars.length; i++) {
        var st = stars[i];
        ctx.globalAlpha = night * (calm ? 0.6 : 0.42 + 0.34 * Math.sin(t * 0.9 + st[3]));
        ctx.fillRect(st[0], st[1], st[2], st[2]);
      }
      ctx.globalAlpha = 1;
    }
    var sun = body(0), moon = body(1);
    disc(sun, pal.sun, 0.46, 0, t);
    disc(moon, [241, 237, 227], 0.09 + 0.13 * lit, 1, t);

    ctx.fillStyle = rgb(pal.sea); ctx.fillRect(0, hz, W, H - hz);
    if (sun.up) glitter(sun, pal.sun, t);
    if (moon.up && lit > 0.1) glitter(moon, [241, 237, 227], t);
    ctx.fillStyle = rgb(pal.isle);
    var iw = Math.min(W * 0.34, 380), ih = Math.max(7, hillA * 0.2);
    island(cx - hillS * 1.02 - iw * 0.35, iw, ih);
    island(cx + hillS * 0.55, iw * 0.55, ih * 0.7);

    ctx.fillStyle = rgb(pal.far); hill(yFar);
    ctx.fillStyle = rgb(pal.near); hill(yNear);
    shadow(sun, 1); shadow(moon, 0.55 * lit);

    // The whole tree first (the logo's trunk plus its limbs), then the foliage hanging in front of it.
    ctx.save();
    ctx.translate(ax(0), ay(0)); ctx.scale(s, s);
    ctx.fillStyle = rgb(pal.trunk); fillLimbs(); ctx.fill(trunkPath, "evenodd");
    ctx.restore();
    ctx.fillStyle = rgb(pal.leaf); canopy();
    var j;

    ctx.fillStyle = rgb(pal.berry);
    var br = 2.3 * Math.max(0.7, s);
    for (i = 0; i < bones.length; i++) {
      var fr = bones[i].fruit;
      if (!fr) continue;
      boughPoint(bones[i], fr.at, spot);
      for (j = 0; j < fr.dots.length; j++) {
        var g = fr.dots[j][2];
        if (!g) continue;
        var pop = g < 1 ? 1 + 2.7 * Math.pow(g - 1, 3) + 1.7 * Math.pow(g - 1, 2) : 1;   // springs up past full size, then settles
        ctx.beginPath(); ctx.arc(spot[0] + fr.dots[j][0] * s, spot[1] + fr.dots[j][1] * s, br * Math.max(0, pop), 0, 6.2832); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;


    ctx.fillStyle = rgb(pal.berry);
    for (i = 0; i < berries.length; i++) {
      var q = berries[i];
      ctx.globalAlpha = Math.max(0, Math.min(1, q.a));
      ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (drag >= 0) {
      // Below the horizon the dragged light is hidden by the land, so a faint ring shows where the hand is.
      var held = body(drag);
      if (held.y > hz - discR * 0.5) {
        ctx.globalAlpha = Math.min(0.55, (held.y - (hz - discR * 0.5)) / discR * 0.55);
        ctx.strokeStyle = "#F1EDE3"; ctx.lineWidth = 1.5; ctx.setLineDash([4, 5]);
        ctx.beginPath(); ctx.arc(held.x, Math.min(held.y, H - discR - 6), discR, 0, 6.2832); ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha = 1;
      }
    }
    prompt(t);
    label(dt);
    clearing();
  }

  // ---------- loop ----------
  var raf = 0, last = 0, born = 0;
  hint.textContent = "Tell us your idea. We\u2019ll find the right light to make it shine.";
  function frame(now) {
    raf = requestAnimationFrame(frame);
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
    // If the device can't hold a smooth pace, step the drawing resolution down until it can.
    if (last && maxDpr > 1.25) {
      spent += now - last;
      if (++counted === 50) {
        if (spent / 50 > 19.5) { maxDpr = Math.max(1.25, maxDpr - 0.5); resize(); }
        spent = 0; counted = 0;
      }
    }
    last = now;
    if (!born) born = now;
    idle = drag >= 0 ? 0 : idle + dt;
    // After 30 untouched seconds the light drifts back to the visitor's own time.
    if (manual && !ret && idle > 30) ret = { from: hour, by: ((clockHour() - hour + 36) % 24) - 12, t: calm ? 1 : 0 };
    if (ret) {
      ret.t = Math.min(1, ret.t + dt / 2.8);
      var e = ret.t * ret.t * (3 - 2 * ret.t);
      hour = (ret.from + ret.by * e + 24) % 24;
      if (ret.t >= 1) { ret = null; manual = false; didDrag = false; born = now - 5000; }
    }
    if (!manual) {
      // On arrival the light glides in from an hour and a half earlier, so it is seen to move.
      var g = calm ? 1 : Math.min(1, (now - born) / 2200);
      hour = (clockHour() - 1.5 * Math.pow(1 - g, 3) + 24) % 24;
    }
    var wantLogin = loginEl && loginEl.classList.contains("open") ? 1 : 0;
    loginP = calm ? wantLogin : loginP + (wantLogin - loginP) * Math.min(1, dt * 9);
    setPalette(hour);
    step(now / 1000, dt);
    pose(); poseLimbs();
    draw(now / 1000, dt);
  }

  try {
    buildTree();
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", function () { setTimeout(resize, 250); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize);
    raf = requestAnimationFrame(frame);
  } catch (e) { fail(); }
})();
