/*function colormatch(c1,c2){
	var rDiff = Math.abs(c1.r - c2.r);
    var gDiff = Math.abs(c1.g - c2.g);
    var bDiff = Math.abs(c1.b - c2.b);
 
    var rScore = 100 - (rDiff / 255 * 100);
    var gScore = 100 - (gDiff / 255 * 100);
    var bScore = 100 - (bDiff / 255 * 100);
 
    return Math.round((rScore + gScore + bScore) / 3);
}*/
function checkScore(t,p) {
    var currentStageScore = 0;
 
    var rgb = p
    var xyz = rgbToXyz(rgb[0], rgb[1], rgb[2]);
    var lab = xyzToLab(xyz[0], xyz[1], xyz[2]);

    var rgb2 = t
    var xyz2 = rgbToXyz(rgb2[0], rgb2[1], rgb2[2]);
    var lab2 = xyzToLab(xyz2[0], xyz2[1], xyz2[2]);

    var diff = cie1994(lab, lab2, false);
 
    return currentStageScore = parseFloat((100 - diff).toFixed(2));
};
/* To score color accuracy properly we need to convert HSL to LAB and then get Delta-E by using CIE94 formula */
/* To do this we need to convert HSL to RGB to XYZ to LAB, then run CIE94 formula */
 
// Convert HSL to RGB
function hslToRgb(h, s, l){
    var r, g, b;
 
    if (s == 0){
        r = g = b = l;
    }
    else{
        function hue2rgb(p, q, t){
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }
 
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
 
    return [r * 255, g * 255, b * 255].map(Math.round);
};
// Convert RGB to XYZ
function rgbToXyz(r, g, b) {
    var _r = (r / 255);
    var _g = (g / 255);
    var _b = (b / 255);
 
    if (_r > 0.04045) {
        _r = Math.pow(((_r + 0.055) / 1.055), 2.4);
    }
    else {
        _r = _r / 12.92;
    }
 
    if (_g > 0.04045) {
        _g = Math.pow(((_g + 0.055) / 1.055), 2.4);
    }
    else {                 
        _g = _g / 12.92;
    }
 
    if (_b > 0.04045) {
        _b = Math.pow(((_b + 0.055) / 1.055), 2.4);
    }
    else {                  
        _b = _b / 12.92;
    }
 
    _r = _r * 100;
    _g = _g * 100;
    _b = _b * 100;
 
    X = _r * 0.4124 + _g * 0.3576 + _b * 0.1805;
    Y = _r * 0.2126 + _g * 0.7152 + _b * 0.0722;
    Z = _r * 0.0193 + _g * 0.1192 + _b * 0.9505;
 
    return [X, Y, Z];
};
// Convert XYZ to LAB
function xyzToLab(x, y, z) {
    var ref_X =  95.047;
    var ref_Y = 100.000;
    var ref_Z = 108.883;
 
    var _X = x / ref_X;
    var _Y = y / ref_Y;
    var _Z = z / ref_Z;
 
    if (_X > 0.008856) {
         _X = Math.pow(_X, (1/3));
    }
    else {                 
        _X = (7.787 * _X) + (16 / 116);
    }
 
    if (_Y > 0.008856) {
        _Y = Math.pow(_Y, (1/3));
    }
    else {
      _Y = (7.787 * _Y) + (16 / 116);
    }
 
    if (_Z > 0.008856) {
        _Z = Math.pow(_Z, (1/3));
    }
    else { 
        _Z = (7.787 * _Z) + (16 / 116);
    }
 
    var CIE_L = (116 * _Y) - 16;
    var CIE_a = 500 * (_X - _Y);
    var CIE_b = 200 * (_Y - _Z);
 
    return [CIE_L, CIE_a, CIE_b];
};
// Finally, use cie1994 to get delta-e using LAB
function cie1994(x, y, isTextiles) {
    var x = {l: x[0], a: x[1], b: x[2]};
    var y = {l: y[0], a: y[1], b: y[2]};
    labx = x;
    laby = y;
    var k2;
    var k1;
    var kl;
    var kh = 1;
    var kc = 1;
    if (isTextiles) {
        k2 = 0.014;
        k1 = 0.048;
        kl = 2;
    }
    else {
        k2 = 0.015;
        k1 = 0.045;
        kl = 1;
    }
 
    var c1 = Math.sqrt(x.a * x.a + x.b * x.b);
    var c2 = Math.sqrt(y.a * y.a + y.b * y.b);
 
    var sh = 1 + k2 * c1;
    var sc = 1 + k1 * c1;
    var sl = 1;
 
    var da = x.a - y.a;
    var db = x.b - y.b;
    var dc = c1 - c2;
 
    var dl = x.l - y.l;
    var dh = Math.sqrt(da*da + db*db - dc * dc);
 
    return Math.sqrt(Math.pow((dl/(kl * sl)),2) + Math.pow((dc/(kc * sc)),2) + Math.pow((dh/(kh * sh)),2));
};