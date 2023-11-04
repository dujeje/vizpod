const width = 800;
const height = 400;
const margin = { top: 200, right: 30, bottom: 30, left: 90 };
const svgWidth = 960;
const svgHeight = 500;

const xScale = d3.scaleTime()
    .domain([new Date(2000, 0, 1), new Date(2023, 11, 31)])
    .range([margin.left, width - margin.right]);

const yScale = d3.scaleLinear()
    .range([height, 0]);

const svg = d3.select("#line-chart-container")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)
    .append("g")
    .attr("transform", `translate(0, 50)`);

const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

d3.dsv(";", "fatalities_isr_pse_conflict_2000_to_2023.csv").then(function (data) {
    function countFatalities(data, citizenship) {
        const counts = {};
        data.forEach(d => {
            if (d.citizenship === citizenship) {
                const year = new Date(d.date_of_death).getFullYear();
                if (!isNaN(year)) {
                    counts[year] = (counts[year] || 0) + 1;
                }
            }
        });
        console.log(counts);
        return counts;

    }

    const palestinianCounts = countFatalities(data, 'Palestinian');
    const israeliCounts = countFatalities(data, 'Israeli');


    const maxCount = Math.max(
        d3.max(Object.values(palestinianCounts)),
        d3.max(Object.values(israeliCounts))
    );

    yScale.domain([0, maxCount]);

    const line = d3.line()
        .x(d => xScale(new Date(d.year, 0, 1)))
        .y(d => yScale(d.count));

    const dataForPlot = [
        { citizenship: 'Palestinian', values: Object.entries(palestinianCounts).map(([year, count]) => ({ year: +year, count })) },
        { citizenship: 'Israeli', values: Object.entries(israeliCounts).map(([year, count]) => ({ year: +year, count })) }
    ];

    dataForPlot.forEach(d => {
        const validData = d.values.filter(dataPoint => !isNaN(dataPoint.year) && !isNaN(dataPoint.count));

        svg.append("path")
            .datum(validData)
            .attr("fill", "none")
            .attr("stroke", d.citizenship === "Palestinian" ? "blue" : "red")
            .attr("stroke-width", 1)
            .attr("d", line);
    });

    const listeningRect = svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "none")
        .attr("pointer-events", "all");

    function showTooltip(event) {
        const [xPos] = d3.pointer(event);
        const date = xScale.invert(xPos);

        if (date >= new Date(2000, 0, 1) && date <= new Date(2023, 11, 31)) {
            const closestDataPoints = dataForPlot.map(d => {
                if (!d || !d.values) {
                    return {
                        citizenship: d.citizenship,
                        count: "N/A",
                    };
                }

                const bisectDate = d3.bisector(point => point.year).left;
                const index = bisectDate(d.values, date.getFullYear(), 1);
                const d0 = d.values[index - 1];
                const d1 = d.values[index];

                if (!d0 || !d1 || !d0.year || !d1.year) {
                    return {
                        citizenship: d.citizenship,
                        count: "N/A",
                    };
                }

                const dataPoint = date - d0.year > d1.year - date ? d1 : d0;

                return {
                    citizenship: d.citizenship,
                    count: dataPoint.count,
                };
            });

            const tooltipContent = `
        <strong>Year:</strong> ${date.getFullYear()}<br>
        <strong>Palestinian:</strong> ${closestDataPoints[0].count}<br>
        <strong>Israeli:</strong> ${closestDataPoints[1].count}
        `;

            tooltip.html(tooltipContent);

            tooltip.style("display", "block");

            tooltip.style("left", `${event.pageX}px`);
            tooltip.style("top", `${event.pageY - 30}px`);
        } else {
            tooltip.style("display", "none");
        }
    }

    let tooltipTimeout;

    function hideTooltip() {
        tooltipTimeout = setTimeout(() => {
            tooltip.style("display", "none");
        }, 3500);
    }

    listeningRect.on("mouseout", () => {
        clearTimeout(tooltipTimeout);
        hideTooltip();
    });

    listeningRect.on("mousemove", showTooltip);
    listeningRect.on("mouseout", hideTooltip);


    svg.append("g")
        .call(d3.axisBottom(xScale)
            .ticks(d3.timeYear.every(1))
            .tickFormat(d3.timeFormat("%Y")))
        .attr("transform", `translate(0,${height})`);

    svg.selectAll(".xGrid")
        .data(xScale.ticks(23))
        .enter()
        .append("line")
        .attr("class", "xGrid")
        .attr("x1", d => xScale(d))
        .attr("x2", d => xScale(d))
        .attr("y1", height)
        .attr("y2", 0)
        .attr("stroke", "#e0e0e0")
        .attr("stroke-width", 0.5);

    svg.selectAll(".yGrid")
        .data(yScale.ticks(5))
        .enter()
        .append("line")
        .attr("class", "yGrid")
        .attr("x1", margin.left)
        .attr("x2", width - margin.right)
        .attr("y1", d => yScale(d))
        .attr("y2", d => yScale(d))
        .attr("stroke", "#e0e0e0")
        .attr("stroke-width", 0.5);

    svg.append("g")
        .call(d3.axisLeft(yScale))
        .attr("transform", `translate(${margin.left}, 0)`);

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 30)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "#777")
        .style("font-family", "sans-serif")
        .text("Number of fatalities");

    svg.append("text")
        .attr("class", "chart-title")
        .attr("x", 400)
        .attr("y", -10)
        .style("font-size", "24px")
        .style("font-weight", "bold")
        .style("font-family", "sans-serif")
        .style("text-anchor", "middle")
        .text("Fatality Trends in Israeli-Palestinian from 2000 to 2023");

    svg.append("text")
        .attr("x", xScale(new Date(2023, 0, 1)))
        .attr("y", yScale(palestinianCounts[2023]))
        .text("Palestinian")
        .style("font-size", "12px")
        .style("fill", "blue");

    svg.append("text")
        .attr("x", xScale(new Date(2023, 0, 1)))
        .attr("y", yScale(israeliCounts[2023]))
        .text("Israeli")
        .style("font-size", "12px")
        .style("fill", "red");

});