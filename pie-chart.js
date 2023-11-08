const pieWidth = 500;
const pieHeight = 500;
const radius = Math.min(pieWidth, pieHeight) / 2;
const titleText = "Number of victims in Israeli-Palestinian conflict from 2000 to 2023";
const container = d3.select("#pie-chart-container");

container.append("div")
    .attr("class", "chart-title")
    .text(titleText);

d3.select(".chart-title")
    .style("font-weight", "bold")
    .style("margin-top", "20px")
    .style("font-size", "24px")
    .style("font-family", "sans-serif");

const pieChart = container.append("svg")
    .attr("width", pieWidth)
    .attr("height", pieHeight)
    .append("g")
    .attr("transform", `translate(${pieWidth / 2},${pieHeight / 2})`);

// Update the pie chart based on the selected year
function updatePieChart(selectedYear) {
    d3.dsv(";", "fatalities_isr_pse_conflict_2000_to_2023.csv").then(function (data) {
        function preprocessData(data, year) {
            const count = {
                Palestinian: 0,
                Israeli: 0,
            };

            data.forEach(d => {
                const citizenship = d.citizenship;
                const yearOfDeath = new Date(d.date_of_death).getFullYear();

                if (citizenship === "Palestinian" && yearOfDeath === year) {
                    count.Palestinian++;
                } else if (citizenship === "Israeli" && yearOfDeath === year) {
                    count.Israeli++;
                }
            });

            return count;
        }

        const processedData = preprocessData(data, selectedYear);

        const pie = d3.pie()
            .value(d => d)
            .sort(null)
            (Object.values(processedData));

        const colorScale = d3.scaleOrdinal()
            .domain(["Israeli", "Palestinian"])
            .range(['#3369ff', '#ff5733']);

        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(radius - 100);

        const tooltip = container.append("div")
            .attr("class", "tooltip")
            .style("display", "none");

        const pieChartGroup = pieChart.selectAll("path")
            .data(pie)
            .join("path")
            .attr("d", arc)
            .attr("fill", d => colorScale(["Israeli", "Palestinian"][d.index]))
            .on("mouseover", function (event, d) {
                tooltip.html(`<strong>${d.data} Victims (${(d.data / (processedData.Palestinian + processedData.Israeli) * 100).toFixed(2)}%)</strong>`);
                tooltip.style("display", "block")
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px");
            })
            .on("mouseout", function () {
                tooltip.style("display", "none");
            });

        pieChart.selectAll("text")
            .data(pie)
            .join("text")
            .text(d => `${(d.data / (processedData.Palestinian + processedData.Israeli) * 100).toFixed(2)}%`)
            .attr("transform", d => `translate(${arc.centroid(d)[0]}, ${arc.centroid(d)[1] + 10})`)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("font-weight", "bold")
            .attr("fill", "white");
    }).catch(function (error) {
        console.error("Error loading data:", error);
    });
}

// Initialize the pie chart with data for the year 2000
updatePieChart(2000);

svg.on("mousemove", function (event) {
    const [xPos] = d3.pointer(event);
    const date = xScale.invert(xPos);
    const selectedYear = date.getFullYear();

    // Update the pie chart with data for the selected year
    updatePieChart(selectedYear);
});
