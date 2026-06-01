"""
Simple Hill Climbing Algorithm
================================
Mengambil tetangga pertama yang lebih baik dari posisi saat ini.
Berhenti ketika tidak ada tetangga yang lebih baik (local optima / plateau / ridge).
"""

import math


def heuristic(pos, goal):
    """Manhattan distance sebagai fungsi heuristik (nilai lebih kecil = lebih baik)."""
    return abs(pos[0] - goal[0]) + abs(pos[1] - goal[1])


def euclidean(pos, goal):
    """Euclidean distance untuk mendeteksi ridge."""
    return math.sqrt((pos[0] - goal[0])**2 + (pos[1] - goal[1])**2)


def get_neighbors(pos, rows, cols):
    """Mendapatkan semua tetangga valid (atas, bawah, kiri, kanan)."""
    r, c = pos
    directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    neighbors = []
    for dr, dc in directions:
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < cols:
            neighbors.append((nr, nc))
    return neighbors


def classify_state(current, neighbors, goal, grid):
    """
    Mengidentifikasi kondisi saat ini: normal, local_optima, plateau, atau ridge.
    
    - local_optima: Semua tetangga valid memiliki heuristik lebih buruk
    - plateau: Beberapa tetangga memiliki nilai heuristik SAMA (tidak ada yang lebih baik)
    - ridge: Node dikelilingi tembok/api sehingga jalur terbatas
    """
    current_h = heuristic(current, goal)
    rows, cols = len(grid), len(grid[0])
    
    valid_neighbors = [n for n in neighbors
                       if grid[n[0]][n[1]] not in ["wall", "fire"]]
    
    if not valid_neighbors:
        return "local_optima"
    
    # Cek apakah ada yang bisa kemana-mana
    h_values = [heuristic(n, goal) for n in valid_neighbors]
    min_h = min(h_values)
    
    if min_h < current_h:
        return "normal"
    elif min_h == current_h:
        return "plateau"
    else:
        # Semua tetangga lebih buruk
        # Bedakan ridge (banyak tembok di sekitar) dengan local_optima murni
        blocked = sum(1 for n in get_neighbors(current, rows, cols)
                      if grid[n[0]][n[1]] in ["wall", "fire"])
        if blocked >= 2:
            return "ridge"
        return "local_optima"


def simple_hill_climbing(grid, start, goal):
    """
    Simple Hill Climbing: ambil tetangga pertama yang lebih baik.
    
    Returns:
        dict dengan path, history heuristik, steps, kondisi tiap langkah
    """
    rows = len(grid)
    cols = len(grid[0])

    current = start
    path = [list(current)]
    history = []    # Nilai heuristik di setiap langkah
    steps = []      # Detail tiap langkah untuk visualisasi
    visited = set()
    visited.add(current)

    max_iterations = rows * cols * 2  # Batas iterasi untuk menghindari loop

    for iteration in range(max_iterations):
        current_h = heuristic(current, goal)
        history.append(current_h)

        neighbors = get_neighbors(current, rows, cols)
        state_type = classify_state(current, neighbors, goal, grid)

        # Kumpulkan info tetangga untuk visualisasi
        neighbor_info = []
        for n in neighbors:
            nr, nc = n
            cell_type = grid[nr][nc]
            passable = cell_type not in ["wall", "fire"]
            neighbor_info.append({
                "pos": list(n),
                "h": heuristic(n, goal) if passable else -1,
                "passable": passable
            })

        # Cari tetangga PERTAMA yang lebih baik
        best_neighbor = None
        for n in neighbors:
            r, c = n
            if grid[r][c] in ["wall", "fire"]:
                continue
            if heuristic(n, goal) < current_h:
                best_neighbor = n
                break

        steps.append({
            "iteration": iteration,
            "current": list(current),
            "current_h": current_h,
            "neighbors": neighbor_info,
            "chosen": list(best_neighbor) if best_neighbor else None,
            "state_type": state_type,
            "description": _describe_step("simple", current, best_neighbor,
                                          current_h, goal, state_type, iteration)
        })

        if current == goal:
            history.append(0)
            return {
                "success": True,
                "algorithm": "Simple Hill Climbing",
                "path": path,
                "history": history,
                "steps": steps,
                "local_optima": False,
                "termination": "goal_reached",
                "total_steps": iteration + 1
            }

        if best_neighbor is None:
            return {
                "success": False,
                "algorithm": "Simple Hill Climbing",
                "path": path,
                "history": history,
                "steps": steps,
                "local_optima": True,
                "termination": state_type,
                "total_steps": iteration + 1
            }

        current = best_neighbor
        visited.add(current)
        path.append(list(current))

    return {
        "success": False,
        "algorithm": "Simple Hill Climbing",
        "path": path,
        "history": history,
        "steps": steps,
        "local_optima": True,
        "termination": "max_iterations",
        "total_steps": max_iterations
    }


def _describe_step(algo, current, chosen, current_h, goal, state_type, iteration):
    """Membuat deskripsi teks untuk setiap langkah."""
    if state_type == "normal" and chosen:
        chosen_h = heuristic(tuple(chosen), goal)
        return (f"Langkah {iteration+1}: Dari {current} (h={current_h}) → "
                f"pindah ke {chosen} (h={chosen_h}). Tetangga lebih baik ditemukan.")
    elif state_type == "plateau":
        return (f"Langkah {iteration+1}: ⚠️ PLATEAU terdeteksi di {current} (h={current_h}). "
                f"Semua tetangga memiliki nilai heuristik yang sama.")
    elif state_type == "ridge":
        return (f"Langkah {iteration+1}: ⛰️ RIDGE terdeteksi di {current} (h={current_h}). "
                f"Jalur terhalang dinding/api, membentuk punggung bukit.")
    elif state_type == "local_optima":
        return (f"Langkah {iteration+1}: 🚫 LOCAL OPTIMA di {current} (h={current_h}). "
                f"Tidak ada tetangga yang lebih baik. Algoritma berhenti.")
    return f"Langkah {iteration+1}: Di {current} (h={current_h})."