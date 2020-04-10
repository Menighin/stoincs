const seriesColors = [
    '#9f007e',
    '#febd01',
    '#793138',
    '#1f222d',
    '#590050',
    '#d37043'
];

class HighchartUtils {

    static getTooltipContent(title, items) {
        let content = `<span style="font-size: 12px">${title}</span><br/>`;
        items.forEach(i => {
            content += `<span style="color:${i.color}">●</span> ${i.name}: <b>${i.value}</b><br/>`;
        });

        return content;
    }

}

export { seriesColors as SeriesColors };
export default HighchartUtils;
