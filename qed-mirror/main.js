const cnv = document.getElementById("canvas");
const ctx = cnv.getContext("2d");
const width = cnv.width = 1200;
const height = cnv.height = 1200;
const img = ctx.createImageData(width, height);
const imgData = img.data;

const LIGHT_SPEED = 3 * 10 ** 8; // m/s
const LASER_WAVELENGTH = 665 * 10 ** -9; // m

const AIR_REFRACTIVE_COEFFS = [1, 2.8 * 10 ** -16]
const WATER_REFRACTIVE_COEFFS = [1.324, 3.12 * 10 ** -15, -2.52 * 10 ** -30]
const GLASS_REFRACTIVE_COEFFS = [1.5046, 4.2 * 10 ** -15, -3.2 * 10 ** -29]

console.clear();

function couchy(frequency, coeffs) {
    return coeffs.reduce((total, item, index) => total + item / (frequency ** (index * 2)));
}

let text = "refractive: " + couchy(LASER_WAVELENGTH, GLASS_REFRACTIVE_COEFFS);

document.addEventListener('DOMContentLoaded', function() {
//    document.getElementById("content").innerHTML = text;
});

let frame = 0;

ctx.font = "14px Arial";

const W = 40;
const PATHS_COUNT = 13;

const ARROW_ANGLE0 = 135;
const ARROW_SPEED = 1;

const X0 = 50;
const Y0 = 50;
const GRAPH_Y = 600; 
const ARROW_Y = GRAPH_Y + 50;
const ARROW_LENGTH = 30;
const FINAL_ARROW_X = X0 + W* (PATHS_COUNT/2 - 1);
const FINAL_ARROW_Y = GRAPH_Y + 200;

const SHIFT = 0;

// helpers

function arrowHead (x1, y1, length, angle) {
    angle = angle * Math.PI / 180;
    var x2 = x1 + length * Math.cos(angle),
        y2 = y1 + length * Math.sin(angle);
    return {
        x: Math.round(x2),
        y: Math.round(y2)
    };
}

function lineToAngle(x, y, length, angle) {
    const head = arrowHead(x, y, length, angle);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(head.x, head.y);
    ctx.stroke();
    ctx.fill();

    return head;
}

function drawArrow(x, y, length, angle) {
    var pos = lineToAngle(x, y, length/2, angle);
    lineToAngle(x, y, length/2, angle + 180);
    lineToAngle(pos.x, pos.y, 10, angle - 155);
    lineToAngle(pos.x, pos.y, 10, angle + 155);
}

function drawArrow2(x, y, length, angle) {
    var pos = lineToAngle(x, y, length, angle);
    lineToAngle(pos.x, pos.y, 10, angle - 155);
    lineToAngle(pos.x, pos.y, 10, angle + 155);
}

function angleFromLine(x1, y1, x2, y2) {
    let angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    if (angle < 0) {
        angle += 360;
    }
    return Math.round(angle);
}

function lengthFromLine(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// define objects

function rect(x, y, width, height, text, bottom = true, fill = true) {
    return {
        x,
        y,
        width,
        height,
        text,
        draw() {
            if (fill) {
                ctx.fillRect(x,y,width,height);
            } else {
                ctx.strokeRect(x,y,width,height);
            }
            const text_x = x + (width / 2) - 4;
            const text_y = bottom ? y + height + 16 : y - height - 4;
            ctx.fillText(text, text_x, text_y);
        }
    }
}

function calculatePoints(stops) {
    const length = stops.length;
    //    console.log("length:", length);
    if (length == 0) {
        return [];
    } else if (length == 1) {
        return stops;
    }
    let points = [];   
    for (let i = 0; i < length - 1; i++) {
        //        console.log("i:", i);
        const from = stops[i];
        const to = stops[i + 1];
        const maxPoints = Math.sqrt(Math.abs(to.x - from.x) ** 2 + Math.abs(to.y - from.y) ** 2);
        //        console.log("from:", from, "to:", to);
        for (let j = 0; j < maxPoints; j++) {
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const new_x = Math.round(from.x + dx / maxPoints * j);
            const new_y = Math.round(from.y + dy / maxPoints * j);
            points.push({
                x: new_x,
                y: new_y
            });
        }
        points.push({x: to.x, y: to.y});
    }
    //    console.log(points);
    return points;
}

function path(n, stops) {
    //    console.log("stops:", stops);
    return {
        n: n,
        points: calculatePoints(stops),
        index: 0,
        angle: ARROW_ANGLE0,
        stopped: false,
        step() {
            if (this.index < this.points.length - 1) {
                this.index = this.index + 1;
                this.angle = this.angle - ARROW_SPEED;
                if (this.angle < 0) {
                    this.angle += 360;
                }
            } else {
                this.stopped = true;
            }
        },
        draw() {
            this.points.forEach((p, i) => {
                if (i <= this.index) {
                    // path
                    ctx.fillRect(p.x, p.y, 1, 1);
                    // arrow
                    const arr_x = X0 + n*W + W/2;
                    const arr_y = ARROW_Y;
                    drawArrow(arr_x, arr_y, ARROW_LENGTH, this.angle);
                    // cross
                    const cross_x = X0 + n*W + W/2;
                    const cross_y = GRAPH_Y - this.index*0.2;
                    ctx.moveTo(cross_x, cross_y);
                    ctx.lineTo(cross_x - 3, cross_y - 3);
                    ctx.moveTo(cross_x, cross_y);
                    ctx.lineTo(cross_x + 3, cross_y - 3);
                    ctx.moveTo(cross_x, cross_y);
                    ctx.lineTo(cross_x - 3, cross_y + 3);
                    ctx.moveTo(cross_x, cross_y);
                    ctx.lineTo(cross_x + 3, cross_y + 3);
                    ctx.stroke();
//                    lineToAngle(cross_x, cross_y, 5, 45);
//                    lineToAngle(cross_x, cross_y, 5, 135);
//                    lineToAngle(cross_x, cross_y, 5, 225);
//                    lineToAngle(cross_x, cross_y, 5, 315);
                }
            });
        }
    }
}

const Ps = PATHS_COUNT;

// define static objects

const S = rect(SHIFT + X0 + 75, Y0, 2, 2, "S", false);  // source
const D = rect(SHIFT + 475, Y0, 2, 2, "P", false); // detector
const Q = rect(SHIFT + 300, 45, 10, 20, "Q");      // screen

// mirror
const M = []
for (let i = 0; i < Ps; i++) {
    M.push(rect(X0 + i*W, 200, W, 5, String.fromCharCode(65 + i), true, false));
}
// labels
const L = []
for (let i = 0; i < Ps; i++) {
    const w = 40;
    L.push(rect(X0 + (i+1)*W - W/2, GRAPH_Y-5, 2, 5, String.fromCharCode(65 + i)));
}
// define dynamic objects
// paths
let P = [];
for (let i = 0; i < Ps; i++) {
    const S_stop = {x: S.x, y: S.y};
    const M_stop = {x: M[i].x + W/2, y: M[i].y};
    const D_stop = {x: D.x, y: D.y};
    //    console.log("path:", i, p)
    P.push(path(i, [S_stop, M_stop, D_stop]));
}

function draw() {
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'black';
    // source
    S.draw();
    // detector
    D.draw();
    // screen
    Q.draw();
    // mirror
    for (let i = 0; i < Ps; i++) {
        M[i].draw();
    }
    // labels
    for (let i = 0; i < Ps; i++) {
        L[i].draw();
    }
    // coordinates
    ctx.fillRect(50, GRAPH_Y, 40*13, 2);
    ctx.fillRect(50, GRAPH_Y - 300, 2, 300);
    ctx.fillText("Time", 40, 290);
    // paths
    for (let i = 0; i < Ps; i++) {
        P[i].draw();
    }
    // draw final arrow
    if (P.every(p => p.stopped)) {
        let x = FINAL_ARROW_X;
        let y = FINAL_ARROW_Y;
        let A = [];
        P.forEach(r => { A.push(r.angle); });
        console.log("arrows:", A);
        A.forEach(angle => {
            drawArrow2(x, y, ARROW_LENGTH, angle);
            const head = arrowHead(x, y, ARROW_LENGTH, angle);
            console.log("arrow:", x, y, angle, head);
            x = head.x;
            y = head.y;
        })
        const angle = angleFromLine(FINAL_ARROW_X, FINAL_ARROW_Y, x, y);
        const length = lengthFromLine(FINAL_ARROW_X, FINAL_ARROW_Y, x, y);
        ctx.strokeStyle = 'red';
        drawArrow2(FINAL_ARROW_X, FINAL_ARROW_Y, length, angle);
        return false;
    }
    return true;
}

function step() {
    // progress dynamic objects
    for (let i = 0; i < Ps; i++) {
        P[i].step();
    }
}

window.requestAnimationFrame(update);

function update() {
    ctx.clearRect(0, 0, width, height);
    if (draw()) {
        step();
        frame++;
        window.requestAnimationFrame(update);
    }
}
