import {float2, float3, float4, mat3x3, mat4x4, mul, dot, Camera, OrthographicCamera, OrthonormalBasis, 
    normalize, degToRad, radToDeg, Ray, Cylinder, Plane, distance,
    reflect, refract, negative, projectToPlane, clamp, smoothstep,
    project} from "./math.js"

const canvas = document.querySelector('.N-function-plot');
// const width = canvas.width;
// const height = canvas.height;

let width = canvas.width =  Math.min(innerWidth, 512);
let height = canvas.height =  Math.min(innerWidth, 512);

const ctx = canvas.getContext('2d');

const betaPicker = document.querySelector('#N-function-plot-beta');
const kGPicker = document.querySelector('#N-function-plot-kG');
const wCPicker = document.querySelector('#N-function-plot-wC');
const deltaEtaPPicker = document.querySelector('#N-function-plot-deltaEtaP');
const deltaHMPicker = document.querySelector('#N-function-plot-deltaHM');
const resetButton = document.querySelector('#N-function-plot-reset');

const n_trt_checkbox = document.querySelector('#N-function-plot-trt');
const n_trt_approx_checkbox = document.querySelector('#N-function-plot-trt-approximation');

const output = document.querySelector('.N-function-plot-beta');
const output2 = document.querySelector('.N-function-plot-kG');
const output3 = document.querySelector('.N-function-plot-wC');
const output4 = document.querySelector('.N-function-plot-deltaEtaP');
const output5 = document.querySelector('.N-function-plot-deltaHM');

let beta = degToRad(Math.max(betaPicker.value, 0.5));
let kG = kGPicker.value;
let wC = degToRad(Math.max(wCPicker.value, 0.1));
let deltaEtaP = deltaEtaPPicker.value;
let deltaHM = deltaHMPicker.value;

let showTRT = n_trt_checkbox.checked;
let showTRTApprox = n_trt_approx_checkbox.checked;

betaPicker.addEventListener('input', () => {
    output.textContent = betaPicker.value + "°";
    beta = degToRad(Math.max(betaPicker.value, 0.5));
});

kGPicker.addEventListener('input', () => {
    output2.textContent = kGPicker.value;
    kG = kGPicker.value;
});

wCPicker.addEventListener('input', () => {
    output3.textContent = wCPicker.value + "°";
    wC = degToRad(clamp(wCPicker.value, 0.1, 89.4));
});

deltaEtaPPicker.addEventListener('input', () => {
    output4.textContent = deltaEtaPPicker.value;
    deltaEtaP = deltaEtaPPicker.value;
});

deltaHMPicker.addEventListener('input', () => {
    output5.textContent = deltaHMPicker.value;
    deltaHM = deltaHMPicker.value;
});

resetButton.addEventListener("click", () => {

    camera.distance = 1;
    camera.focus.y = 1;
    camera.focus.x = 0;
});

n_trt_checkbox.addEventListener('change', ()=>
{
    showTRT = n_trt_checkbox.checked;
});

n_trt_approx_checkbox.addEventListener('change', ()=>
{
    showTRTApprox = n_trt_approx_checkbox.checked;
});

let clearColor = "black";
// let clearColor = "#2b2b2b";


function resizeCanvas()
{
    width = canvas.width = Math.min(innerWidth, 512);
    height = canvas.height = Math.min(innerWidth, 512);
}

window.addEventListener('resize', resizeCanvas, false);

ctx.fillStyle = 'rgb(0,0,0)';
ctx.fillRect(0, 0, width, height);

let curX;
let curY;
let pressed = false;
let keyPressed;
let isLeftMouseDown = false;
let isRightMouseDown = false;
let mouseWheelDeltaY = 0;

let position = new float3(0, 0, -3);
const focus = new float3(0, 0, 0);
let up = new float3(0, 1, 0);

let frameCount = 0;
let previousTick = performance.now();
let dt = 0;

let lastPosition = {};
let dx = 0;
let dy = 0;

window.addEventListener('mousemove', updatePosition);

function touchToMouse(event)
{
    let e = event.touches[0];
    curX = e.offsetX;
    curY = e.offsetY;
    // if(typeof(lastPosition.x) != 'undefined')
    // if(isLeftMouseDown || isRightMouseDown)
    {
            dx = e.clientX - lastPosition.x;
            dy = e.clientY - lastPosition.y;
    }
    lastPosition = {x : e.clientX, y : e.clientY};
}

function touchStart(event)
{
    if(event.target !== canvas)
    {
        return;
    }
    let e = event.touches[0];
    isLeftMouseDown = true;
    lastPosition = {x : e.clientX, y : e.clientY};
}

function touchEnd(event)
{
    isLeftMouseDown = false;
}

canvas.addEventListener('touchmove', touchToMouse);
canvas.addEventListener('touchstart', touchStart);
canvas.addEventListener('touchend', touchEnd);

window.addEventListener("touchmove", (e) => {if(e.target == canvas) e.preventDefault();}, {passive:false});
window.addEventListener("touchstart", (e) => {if(e.target == canvas) e.preventDefault();}, {passive:false});
window.addEventListener("touchend", (e) => {if(e.target == canvas) e.preventDefault();}, {passive:false});
// window.addEventListener("wheel", (e) => {if(e.target == canvas) e.preventDefault();}, {passive:false});

canvas.addEventListener("mousedown", e => {
    pressed = true;
    switch(e.button)
    {
        case 0:
            isLeftMouseDown = true;
            break;
        case 2:
            isRightMouseDown = true;
            break;
    }
});

function updatePosition(e)
{
    curX = e.offsetX;
    curY = e.offsetY;
    // if(typeof(lastPosition.x) != 'undefined')
    if(isLeftMouseDown || isRightMouseDown)
    {
            dx = e.movementX;
            dy = e.movementY;
    }

    lastPosition = {x : e.clientX, y : e.clientY};
}

window.addEventListener("mouseup", e => {
    pressed = false;
    switch(e.button)
    {
        case 0: 
            isLeftMouseDown = false;
            break;
        case 2:
            isRightMouseDown = false;
         break;
    }
});


// canvas.addEventListener("wheel", e => {
//     mouseWheelDeltaY = e.deltaY;
//     camera.distance += e.deltaY * 0.001;
// }, {
//     passive: true
//   });

let camera = new OrthographicCamera(3, 3, 0.1, 1000);

camera.distance = 1;
camera.focus.y = 1;
let rotX = 0;
let rotY = 0;
let rotZ = 0;
let direction = new float3(0, 0, -1);
let forward = new float3(0, 0, -1);
let right = new float3(1, 0, 0);
let movementAmount = new float3(0, 0, 0);

let keymap = new Array(256);

canvas.addEventListener("keydown", (e) =>
{
    keyPressed = e.key;
    keymap[e.key] = true;
});
    
canvas.addEventListener("keyup", (e) =>
{
    keymap[e.key] = false;
});

function update(dt)
{
    if(keymap["w"])
    {
        movementAmount.y = 1;
    }
    if(keymap["s"])
    {
        movementAmount.y = -1;
    }
    
    if(keymap["a"])
    {
        movementAmount.x = 1;
    }
    if(keymap["d"])
    {
        movementAmount.x = -1;
    }

    if(keymap["q"])
    {
        camera.rotation.z += -0.01;
        movementAmount.z = -1;
    }
    if(keymap["e"])
    {
        movementAmount.z = 1;
        camera.rotation.z += 0.01;
    }
    // camera.aspectRatio = innerWidth / innerHeight;
    // width = canvas.width = innerWidth;
    // height = canvas.height = innerHeight;
    // camera.fudge = 180;
    // camera.onMouse(dx, dy, isLeftMouseDown ? 0 : (isRightMouseDown ? 1 : -1));
    if(isRightMouseDown)
    {
        camera.distance += (dy * 0.002);
        camera.distance = Math.max(camera.distance, 0.01);

    }
    if(isLeftMouseDown)
    {

        camera.movement.x = -dx * 0.01 * Math.exp(-camera.distance);
        camera.movement.y = dy * 0.01 * Math.exp(-camera.distance);
    }

    camera.update(dt);

}

function drawLine(p0, p1, camera, lineWidth = 2)
{
    let q = new float4(new float3(p0), 1);
    let r = new float4(new float3(p1), 1);
    const viewProjection = mul(camera.view, camera.projection);
    q = mul(q, viewProjection);
    r = mul(r, viewProjection);
    if(q.w <= 0 || r.w <= 0)
    {
        return;
    }
    q = q.div(q.w);
    r = r.div(r.w);

    let x0 = (q.x * 0.5 + 0.5) * width;
    let y0 = (-q.y * 0.5 + 0.5) * height;

    let x1 = (r.x * 0.5 + 0.5) * width;
    let y1 = (-r.y * 0.5 + 0.5) * height;
    
    
    // ctx.strokeStyle = "rgb(255 0 0)";
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
}

function drawLine2D(p0, p1, lineWidth = 1, color = "white", dashed = [])
{
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.setLineDash(dashed);
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
    ctx.restore();
}

function drawLineArrow2D(p0, p1, lineWidth = 1, color = "white", dashed = [])
{
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();

    const n0 = normalize(new float2(p1.x - p0.x, p1.y - p0.y));
    const t0 = new float2(n0.y, -n0.x);
    const p2 = new float2(p1.x - 5 * t0.x - n0.x * 10, p1.y - 5 * t0.y - n0.y * 10);
    const p3 = new float2(p1.x + 5 * t0.x - n0.x * 10, p1.y + 5 * t0.y - n0.y * 10);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.fill();
}

function drawText(p, text, color = "white", font = "14px monospace", align = "center")
{
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(text, p.x, p.y);
}

function projectPointToScreen(point, width, height, viewProjection)
{
    if(point instanceof float2)
    {
        point = new float4(point.x, point.y, 0, 1);
    }
    const result = mul(new float4(point.x, point.y, point.z, 1), viewProjection);
    const projectedX = ((result.x / result.w) * 0.5 + 0.5) * width;
    const projectedY = (1 - (((result.y / result.w)) * 0.5 + 0.5)) * height;
    return new float2(projectedX, projectedY);
}

function drawCircle(position, radius = 5, style = "white")
{
    ctx.fillStyle = style;
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.arc(position.x, position.y, radius, degToRad(0), degToRad(360), false);
    ctx.fill();   
}


function gaussian(beta, x, mean)
{
    return (1 / (beta * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow(x - mean, 2) / (beta * beta));
}

camera.update(0);
function draw()
{
    let currentTick = performance.now();
    dt = currentTick - previousTick;
    previousTick = currentTick;
 
    update(dt);

    let viewProjection = mul(camera.view, camera.projection);
    ctx.fillStyle = clearColor;
    ctx.fillRect(0, 0, width, height);

    // Draw Axes
    ctx.strokeStyle = "white";
    drawLine(new float3(-1000,0,0), new float3(1000,0,0), camera);

    ctx.strokeStyle = "white";
    drawLine(new float3(0, 0, 0), new float3(0,25,0), camera);

    {
        
        let y_axis = [];
        let x_axis = [];
        let points = [];
        let points1 = [];
        let maxR = -Infinity;
        let integral = 0;
        let n = 500;
        let a = -Math.PI/2;
        let b = Math.PI/2;
        let H = (b - a) / n;
        let hairIOR = 1.55;
        let sinThetaD = Math.sin(beta);
        let cosThetaD = Math.cos(beta);
        let etaP = Math.sqrt(hairIOR * hairIOR - sinThetaD * sinThetaD) / cosThetaD;
        let hCaustic = Math.sqrt((4 - etaP * etaP) / 3);
        let phiC = Math.asin(hCaustic);

        if(showTRT)
        {
            // for (let h = -1; h <= 1; h += 0.01)
            for(let i = 0; i < n; ++i)
            {
                let gamma = a + (i + 0.5) * H;
                let h = Math.sin(gamma);
                // let dPhidH = 4 / Math.sqrt(etaP * etaP - h * h) - 2 / (Math.sqrt(1 - h * h));
                let dPhidH = 4 / (etaP * Math.sqrt(1 - ((h * h) / (etaP * etaP)))) - 2 / (Math.sqrt(1 - h * h));
                let N2 = 1 / (Math.abs(2 * dPhidH));

                let point = new float2(h, N2);
                y_axis.push(N2);
                x_axis.push(h);
                points.push(point);
                if(maxR < N2)
                {
                    maxR = N2;
                }
                integral += N2;
            }
            integral *= H;

            // after etaP >= 2 the caustic will merge and disappear
            if(etaP < 2)
            {
                let dPhidHCaustic = 4 / Math.sqrt(etaP * etaP - hCaustic * hCaustic) - 2 / (Math.sqrt(1 - hCaustic * hCaustic));
                maxR = 1 / Math.abs(2 * dPhidHCaustic);
            }

            ctx.save();
            ctx.strokeStyle = "rgb(255 0 0 / 75%)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            for(let i = 0; i < points.length; ++i)
            {
                const p = projectPointToScreen(points[i].mul(1), width, height, viewProjection);
                if(i == 0)
                {
                    ctx.moveTo(p.x, p.y);
                }
                ctx.lineTo(p.x, p.y);
            }
            ctx.stroke();
            ctx.restore();
        }


        if(showTRTApprox)
        {
            for(let i = 0; i < n; ++i)
            {
                let gamma = a + (i + 0.5) * H;
                let h = Math.sin(gamma);
                let phi = (12 * Math.asin(1 / etaP) / Math.PI - 2) * gamma - 16*Math.asin(1 / etaP) / Math.pow(Math.PI,3) * Math.pow(gamma,3) + 2 * Math.PI;

                while (phi >  Math.PI)
                {
                    phi -= 2 * Math.PI;
                }
                while (phi < -Math.PI)
                {
                    phi += 2 * Math.PI;
                }

                // let dPhidH = 4 / Math.sqrt(etaP * etaP - h * h) - 2 / (Math.sqrt(1 - h * h));
                let dPhidH = 4 / (etaP * Math.sqrt(1 - ((h * h) / (etaP * etaP)))) - 2 / (Math.sqrt(1 - h * h));
                let Np2 = 1 / (Math.abs(2 * dPhidH));
                let phiC = Math.asin(hCaustic);

                let d2PhidH2 = ((4 * hCaustic) / (Math.pow(etaP, 3) * Math.pow(1 - Math.pow(hCaustic / etaP, 2), 3 / 2.0 ))) - ((2 * hCaustic) / Math.pow(1 - hCaustic * hCaustic, 3.0 / 2));
                // let d2PhidH2 = ((4 * hCaustic) / (Math.pow(etaP * etaP - hCaustic * hCaustic, 3 / 2.0 ))) - ((2 * hCaustic) / Math.pow(1 - hCaustic * hCaustic, 3.0 / 2));
                let deltaH = Math.min(deltaHM, 2 * Math.sqrt(2 * wC / Math.abs(d2PhidH2)));
                let t = 1;
                
                if(etaP >= 2)
                {
                    phiC = 0;
                    deltaH = deltaHM;
                    t = smoothstep(2, 2 + deltaEtaP, etaP);
                }

                let L = Np2;
                L = L * (1 - t * gaussian(wC, phi - phiC, 0) / gaussian(wC, 0, 0));
                L = L * (1 - t * gaussian(wC, phi + phiC, 0) / gaussian(wC, 0, 0));
                L = L + t * kG * deltaH * (gaussian(wC, phi - phiC, 0) + gaussian(wC, phi + phiC, 0));
                

                let point = new float2(h, L);
                points1.push(point);
            }

            {
                ctx.save();
                ctx.strokeStyle = "rgb(0 200 128 / 100%)";
                ctx.lineWidth = 2;
                if(showTRT && showTRTApprox)
                {
                    ctx.setLineDash([5, 5]);
                }
                ctx.beginPath();
                for(let i = 0; i < points1.length; ++i)
                {
                    const p = projectPointToScreen(points1[i], width, height, viewProjection);
                    if(i == 0)
                    {
                        ctx.moveTo(p.x, p.y);
                    }
                    ctx.lineTo(p.x, p.y);
                }
                ctx.stroke();
                ctx.restore();
            }
        }

        drawText(new float2(16, 16), `max value: ${maxR.toFixed(2)}`, undefined, undefined, "left");
        // drawText(new float2(16, 32), `integral: ${integral.toFixed(3)}`, undefined, undefined, "left");
        drawText(new float2(16, 32), `η'[etaP]: ${etaP.toFixed(2)}`, undefined, undefined, "left");
        drawText(new float2(16, 48), `h caustic [hC]: ${etaP < 2 ? hCaustic.toFixed(2) : "N/A"}`, undefined, undefined, "left");
        drawText(new float2(16, 64), `phiC: ${radToDeg(phiC).toFixed(2)}`, undefined, undefined, "left");

        // x-axis
        {
            const n = 10;
            const a = 0;
            const b = 2;
            const dx = 0.5;

            const textPos = projectPointToScreen(new float2(0, 0).add(new float2(0, -0.1)), width, height, viewProjection);
            drawText(textPos, "h");
            for(let i = 1; i < n; ++i)
            {
                const point = new float2(a + i * dx, 0);
                const point1 = new float2(a - i * dx, 0);
                const p = projectPointToScreen(point.add(new float2(0, 0.025)), width, height, viewProjection);
                drawLine(point, point.add(new float2(0, 0.025)), camera, 2);
                drawText(p, `${i * dx}`, "white", undefined, "center");
                const p1 = projectPointToScreen(point1.add(new float2(0, 0.025)), width, height, viewProjection);
                drawLine(point1, point1.add(new float2(0, 0.025)), camera, 2);
                drawText(p1, `-${i * dx}`, "white", undefined, "center");
            }

            // draw h values where caustic appears
            {
                const causticLocation = new float2(hCaustic, 0);
                const causticLocationSS = projectPointToScreen(causticLocation.add(new float2(0, 0.025)), width, height, viewProjection);

                drawText(causticLocationSS, `${hCaustic.toFixed(2)}`, "red", undefined, "center");
                ctx.strokeStyle = "red";
                // drawLine(causticLocation, causticLocation.add(new float2(0, 0.025)), camera, 3);
                ctx.setLineDash([5, 8]);
                ctx.strokeStyle = "rgb(255 0 0 / 50%)"; 
                drawLine(causticLocation, causticLocation.add(new float2(0, maxR === Infinity ? 1000 : maxR)), camera, 2);
                ctx.setLineDash([]);
                drawText(causticLocationSS.add(new float2(0, 20)), `caustic`, "rgb(255 0 0)");
            }

            {
                const causticLocation = new float2(-hCaustic, 0);
                const causticLocationSS = projectPointToScreen(causticLocation.add(new float2(0, 0.025)), width, height, viewProjection);

                drawText(causticLocationSS, `${-hCaustic.toFixed(2)}`, "red", undefined, "center");
                ctx.strokeStyle = "red";
                // drawLine(causticLocation, causticLocation.add(new float2(0, 0.025)), camera, 3);
                ctx.setLineDash([5, 8]);
                ctx.strokeStyle = "rgb(255 0 0 / 50%)"; 
                drawLine(causticLocation, causticLocation.add(new float2(0, maxR === Infinity ? 1000 : maxR)), camera, 2);
                ctx.setLineDash([]);
                drawText(causticLocationSS.add(new float2(0, 20)), `caustic`, "rgb(255 0 0)");
            }


        }
    }

    {
        const n = 25;
        const a = 0;
        const b = 2;
        const dy = 0.5;
        ctx.strokeStyle = "white";
        for(let i = 0; i < n; ++i)
        {
            const point = new float2(0, a + i * dy);
            const p = projectPointToScreen(point.add(new float2(0.05, 0)), width, height, viewProjection);
            drawLine(point, point.add(new float2(0.05, 0)), camera, 2);
            drawText(p, `${i * dy}`, "white", undefined, "left");
        }
        
    }

    mouseWheelDeltaY = 0;
    dx = 0;
    dy = 0;
    movementAmount.x = 0;
    movementAmount.y = 0;
    movementAmount.z = 0;
    frameCount++;
    requestAnimationFrame(draw);
}

draw();
