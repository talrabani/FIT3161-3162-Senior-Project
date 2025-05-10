import * as d3 from "d3";

// Turn svg object into base64 encoded string
const svgToXML = (svg) => {
    var serializer = new XMLSerializer();
    var xmlString = serializer.serializeToString(svg);
    return 'data:image/svg+xml;base64,' + btoa(xmlString);
    }

// Create canvas to draw the svg into an image
const makeCanvas = (svg) => {
    const img = new Image;
    img.setAttribute('src', svgToXML(svg));
    const canvas = document.createElement('canvas');
    canvas.setAttribute('width', svg.clientWidth);
    canvas.setAttribute('height', svg.clientHeight);
    canvas.getContext('2d').drawImage(img, 0, 0);
    return canvas;
    }

// Download graph 
const downloadGraph = (fileExtension) => {
    if (!d3.select('#chart').node()) return;
    const svg = d3.select('#chart').node();
    if (fileExtension != 'svg') {
        const canvas = makeCanvas(svg);
        var url = canvas.toDataURL(`image/${fileExtension}`, 1.0);
    } else {
        var url = svgToXML(svg);
    }
    const a = document.createElement('a');
    a.setAttribute('download', `download.${fileExtension}`);
    a.setAttribute('href', url);
    a.dispatchEvent(new MouseEvent('click'));
    }
const downloadGraphAsPNG = () => {
    downloadGraph('png');
    }
const downloadGraphAsJPEG = () => {
    downloadGraph('jpeg');
    }
const downloadGraphAsSVG = () => {
    downloadGraph('svg');
    }

export  { downloadGraphAsPNG, downloadGraphAsJPEG, downloadGraphAsSVG };