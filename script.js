// --- Heart Rate Over Time ---
d3.csv("hr_summary_by_minute.csv").then(data => {
    data.forEach(d => {
        d.minute = +d.minute;
        d.mean = +d.mean;
        d.min = +d.min;
        d.max = +d.max;
    });

    data = data.filter(d => d.minute > 0.0);

    const margin = { top: 30, right: 60, bottom: 50, left: 60 },
        width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#hr-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, 180]).range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    const xAxis = d3.axisBottom(x).ticks(10).tickFormat(d => `${d} min`);
    const yAxis = d3.axisLeft(y);

    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis);

    svg.append("g")
        .attr("class", "y-axis");

    const tooltip = d3.select(".tooltip");

    const line = d3.line()
        .x(d => x(d.minute))
        .y(d => y(d.mean));

    const area = d3.area()
        .x(d => x(d.minute))
        .y0(d => y(d.min))
        .y1(d => y(d.max));

    const students = [...new Set(data.map(d => d.student))];
    const exams = [...new Set(data.map(d => d.exam))];

    // Student dropdown
    const studentDropdown = d3.select("#hr-measure")
        .html("")
        .selectAll("option")
        .data(students)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);

    // Exam dropdown
    const examDropdown = d3.select("#hr-chart")
        .insert("div", ":first-child")
        .attr("class", "controls")
        .html('<label for="exam-select">Exam:</label><select id="exam-select"></select>');

    d3.select("#exam-select")
        .selectAll("option")
        .data(exams)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);

    function update(selectedStudent, selectedExam) {
        const filtered = data.filter(d => d.student === selectedStudent && d.exam === selectedExam);

        if (selectedExam.includes("Final")) {
            x.domain([0.1, 180]);
        } else {
            x.domain([0.1, 90]);
        }

        svg.select(".x-axis").transition().duration(500).call(xAxis);

        y.domain([40, 200]);
        svg.select(".y-axis").transition().duration(500).call(yAxis);
        y.domain([40, 200]); // fixed y-axis to show all values

        svg.select(".y-axis").transition().duration(500).call(yAxis);
        svg.selectAll(".line-path, .area-path, .hover-rect, .focus-dot").remove();

        // X axis label
        svg.append("text")
            .attr("class", "x-label")
            .attr("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 10)
            .text("Exam Time (minutes)");

        // Y axis label
        svg.append("text")
            .attr("class", "y-label")
            .attr("text-anchor", "middle")
            .attr("transform", `rotate(-90)`)
            .attr("x", -height / 2)
            .attr("y", -margin.left + 20)
            .text("Heart Rate (BPM)");

        svg.append("path")
            .datum(filtered)
            .attr("class", "area-path")
            .attr("fill", "steelblue")
            .attr("opacity", 0.2)
            .attr("d", area);

        svg.append("path")
            .datum(filtered)
            .attr("class", "line-path")
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2.5)
            .attr("d", line);

        const focus = svg.append("circle")
            .attr("class", "focus-dot")
            .attr("r", 4)
            .attr("fill", "steelblue")
            .style("opacity", 0);

        svg.append("rect")
            .attr("class", "hover-rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "none")
            .attr("pointer-events", "all")
            .on("mousemove", event => {
                const [mx] = d3.pointer(event);
                const time = x.invert(mx);
                const bisect = d3.bisector(d => d.minute).left;
                const idx = bisect(filtered, time);
                const d = filtered[Math.min(idx, filtered.length - 1)];

                focus
                    .attr("cx", x(d.minute))
                    .attr("cy", y(d.mean))
                    .style("opacity", 1);

                tooltip
                    .style("opacity", 1)
                    .html(`Minute: ${d.minute.toFixed(1)}<br>HR: ${d.mean.toFixed(1)} bpm`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`);
            })
            .on("mouseout", () => {
                focus.style("opacity", 0);
                tooltip.style("opacity", 0);
            });
    }


    d3.select("#hr-measure").on("change", function() {
        const selectedStudent = this.value;
        const selectedExam = d3.select("#exam-select").property("value");
        update(selectedStudent, selectedExam);
    });

    d3.select("#exam-select").on("change", function() {
        const selectedStudent = d3.select("#hr-measure").property("value");
        const selectedExam = this.value;
        update(selectedStudent, selectedExam);
    });

    // Initial call
    update(students[0], exams[0]);
});
// --- Signal vs Exam Score Scatterplot ---
d3.csv("merged_signal_grades.csv").then(data => {
    data.forEach(d => {
        d.avg_value = +d.avg_value;
        d.exam_score = +d.exam_score;
    });

    const margin = { top: 30, right: 60, bottom: 50, left: 80 },
        width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#score-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    const xAxis = d3.axisBottom(x);
    const yAxis = d3.axisLeft(y);

    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`);

    svg.append("g")
        .attr("class", "y-axis");

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip");

    const color = d3.scaleOrdinal()
        .domain(["Midterm 1", "Midterm 2", "Final"])
        .range(["#1f77b4", "#ff7f0e", "#2ca02c"]);

    const signals = [...new Set(data.map(d => d.signal))];
    const exams = [...new Set(data.map(d => d.exam))];

    // Dropdown for signal
    const signalDropdown = d3.select("#score-chart")
        .insert("div", ":first-child")
        .attr("class", "controls")
        .html('<label for="signal-dropdown">Signal:</label>')
        .append("select")
        .attr("id", "signal-dropdown");

    signalDropdown.selectAll("option")
        .data(signals)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);

    // Checkbox group for exams
    const examControls = d3.select("#score-chart")
        .insert("div", ":first-child")
        .attr("class", "controls")
        .attr("id", "exam-checkboxes");

    exams.forEach(exam => {
        const label = examControls.append("label");
        label.append("input")
            .attr("type", "checkbox")
            .attr("value", exam)
            .property("checked", true);
        label.append("span").text(` ${exam}`);
    });

    function update() {
        const selectedSignal = d3.select("#signal-dropdown").property("value");
        const selectedExams = Array.from(document.querySelectorAll("#exam-checkboxes input:checked")).map(d => d.value);

        const filtered = data.filter(d => d.signal === selectedSignal && selectedExams.includes(d.exam));

        // Adjust y-axis range depending on selected exams
        y.domain([0, 100]);

        x.domain(d3.extent(filtered, d => d.avg_value)).nice();

        svg.select(".x-axis")
            .transition().duration(500)
            .call(xAxis);

        svg.select(".y-axis")
            .transition().duration(500)
            .call(yAxis);

        // Remove old labels and add new ones
        svg.select(".x-axis-label").remove();
        svg.append("text")
            .attr("class", "x-axis-label")
            .attr("x", width / 2)
            .attr("y", height + 40)
            .style("text-anchor", "middle")
            .text("Average Signal Level");

        svg.select(".y-axis-label").remove();
        svg.append("text")
            .attr("class", "y-axis-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -50)
            .style("text-anchor", "middle")
            .text("Exam Score");

        const circles = svg.selectAll(".point")
            .data(filtered, d => d.student + d.signal + d.exam);

        circles.exit().remove();

        const newCircles = circles.enter()
            .append("circle")
            .attr("class", "point")
            .attr("r", 0)
            .attr("opacity", 0.8)
            .on("mouseover", function(event, d) {
                tooltip
                    .style("opacity", 1)
                    .html(`Student: ${d.student}<br>Exam: ${d.exam}<br>Score: ${d.exam_score}<br>Signal Value: ${d.avg_value.toFixed(2)}`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`);
            })
            .on("mouseout", () => tooltip.style("opacity", 0));

        newCircles.merge(circles)
            .transition().duration(500)
            .attr("cx", d => x(d.avg_value))
            .attr("cy", d => y(d.exam_score))
            .attr("r", 6)
            .attr("fill", d => color(d.exam));
    }

    d3.select("#signal-dropdown").on("change", update);
    d3.selectAll("#exam-checkboxes input").on("change", update);

    update();
});