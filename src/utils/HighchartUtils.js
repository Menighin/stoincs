const seriesColors = [
    '#9f007e',
    '#febd01',
    '#2D7DD2',
    '#97CC04',
    '#F45D01',
    '#474647',
    '#2F4858',
    '#33658A',
    '#86BBD8',
    '#F26419'
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
