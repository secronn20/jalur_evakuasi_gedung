from flask import Flask, render_template, request, jsonify
from algorithms.simple_hill import simple_hill_climbing
from algorithms.steepest_hill import steepest_ascent_hill_climbing
from algorithms.stochastic_hill import stochastic_hill_climbing

app = Flask(__name__)


def find_positions(grid):
    """Menemukan posisi start dan exit di grid."""
    start = None
    goal = None

    for r in range(len(grid)):
        for c in range(len(grid[r])):
            if grid[r][c] == "start":
                start = (r, c)
            elif grid[r][c] == "exit":
                goal = (r, c)

    return start, goal


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/run", methods=["POST"])
def run_algorithm():
    data = request.get_json()

    grid = data.get("grid")
    algorithm = data.get("algorithm", "simple")

    if not grid:
        return jsonify({"error": "Grid tidak ditemukan"}), 400

    start, goal = find_positions(grid)

    if not start or not goal:
        return jsonify({
            "error": "Posisi Start dan Exit harus ditentukan di grid!"
        }), 400

    # Pilih algoritma
    if algorithm == "simple":
        result = simple_hill_climbing(grid, start, goal)

    elif algorithm == "steepest":
        result = steepest_ascent_hill_climbing(grid, start, goal)

    elif algorithm == "stochastic":
        result = stochastic_hill_climbing(grid, start, goal)

    else:
        return jsonify({"error": f"Algoritma '{algorithm}' tidak dikenal"}), 400

    return jsonify(result)


@app.route("/compare", methods=["POST"])
def compare_algorithms():
    """Jalankan semua algoritma dan bandingkan hasilnya."""
    data = request.get_json()
    grid = data.get("grid")

    if not grid:
        return jsonify({"error": "Grid tidak ditemukan"}), 400

    start, goal = find_positions(grid)

    if not start or not goal:
        return jsonify({"error": "Start dan Exit harus ditentukan"}), 400

    results = {
        "simple": simple_hill_climbing(grid, start, goal),
        "steepest": steepest_ascent_hill_climbing(grid, start, goal),
        "stochastic": stochastic_hill_climbing(grid, start, goal),
    }

    return jsonify(results)


if __name__ == "__main__":
    app.run(debug=True)