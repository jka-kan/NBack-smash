// Get user's score statistics from views and draw a line chart

$.get("get_results", function(data, status){
    //alert("Data: " + data["scores"] + "\nStatus: " + status);
    scores = data["scores"]
    labels = data["game_id"]
    right_answers = data["right_answer_percent"]

    // Expand y-axis so that score line never reaches the top
    // User gets impression that there's always room for to make better results
    var highest_score = Math.max.apply(Math, scores) + 5;

    const score_data = {
        labels: labels,
        datasets: [{
        label: 'Score',
        yAxisID: "A",
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: 'rgb(255, 99, 132)',
        data: scores
        },
        {
        label: 'Right Answers %',
        yAxisID: "B",
        backgroundColor: 'rgb(0, 51, 204)',
        borderColor: 'rgb(0, 51, 204)',
        data: right_answers
        }
        ]
    };
    
    const right_answer_data = {
        labels: labels,
        datasets: [{
        label: 'Scores',
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: 'rgb(255, 99, 132)',
        data: right_answers
        },
        ]
    };

    function makeChart() {
    const stackedLine = new Chart(document.getElementById('chartCanvas'),
    {
    type: "line",
    data: score_data,
    options: {
        scales: {
            A: {
                stacked: true,
                min: 0,
                suggestedMax: highest_score,
                position: "left",
                ticks: {color: 'rgb(255, 99, 132)'},
                title: {text: "Score", 
                        display: true,
                        font: {size: 20}
                }


            },
            B: {
                position: "right",
                suggestedMax: 1.00,
                min: 0,
                type: "linear",
                grid: {display: false},
                ticks: {color: 'rgb(0, 51, 204)'},
                title: {text: "% right", 
                        display: true,
                        font: {size: 20}
                }

            },
            x: {
                title: {text: "Game played", 
                display: true,
                font: {size: 20}
            }
                //type: 'linear'
            }
        }
    }
    });
    }

    makeChart();
})