var columns = 9;
var rows = 9;
var difficulty_mode = 'easy';
var mineAmount = 10;
var noMineTiles = 0;
var timeSet = false;
var setMine = false;

function buildGrid() {
    // Fetch grid and clear out old elements.
    var grid = document.getElementById("minefield");
    grid.innerHTML = "";

    // 2d array of the grid used to easily obtain tile with coordinates
    grid2d = [];

    // Build DOM Grid and make 2d array
    var tile;
    for (var x = 0; x < rows; x++) {
        grid2d.push([]);
        for (var y = 0; y < columns; y++) {
            tile = createTile(x,y);
            grid.appendChild(tile);
            grid2d[x].push(tile);
        }
    }

    var style = window.getComputedStyle(tile);

    var width = parseInt(style.width.slice(0, -2));
    var height = parseInt(style.height.slice(0, -2));
    
    grid.style.width = (columns * width) + "px";
    grid.style.height = (rows * height) + "px";
}

function createTile(x,y) {
    var tile = document.createElement("div");

    tile.classList.add("tile");
    tile.classList.add("hidden");

    tile.setAttribute("row", x);
    tile.setAttribute("column", y);
    tile.setAttribute("mined", "false");
    tile.setAttribute("adjacent_mine", 0);
    tile.setAttribute("adjacent_flag", 0);
    
    tile.addEventListener("auxclick", function(e) { e.preventDefault(); }); // Middle Click
    tile.addEventListener("contextmenu", function(e) { e.preventDefault(); }); // Right Click
    tile.addEventListener("mouseup", handleTileClick ); // All Clicks
    tile.addEventListener("mousedown", handleTileClick ); //mouse down for limbo face

    return tile;
}

function startGame() {
    buildGrid();
    stopTimer();
    document.getElementById("timer").innerHTML = 0;
    var smiley = document.getElementById("smiley");

    if (setMine == true) {
        setMine = false;
    }

    if (noMineTiles > 0) {
        noMineTiles = 0;
    }

    if (smiley.classList.contains("face_lose")) {
        smiley.classList.remove("face_lose");
    } else if (smiley.classList.contains("face_win")) {
        smiley.classList.remove("face_win");
    } else if (smiley.classList.contains("face_limbo")) {
        smiley.classList.remove("face_limbo");
    }

    if (difficulty_mode == 'easy') {
        document.getElementById("flagCount").innerHTML = 10;
    } else if (difficulty_mode == 'medium') {
        document.getElementById("flagCount").innerHTML = 40;
    } else if (difficulty_mode == 'hard') {
        document.getElementById("flagCount").innerHTML = 99;
    }
}

function smileyDown() {
    var smiley = document.getElementById("smiley");
    smiley.classList.add("face_down");
}

function smileyUp() {
    var smiley = document.getElementById("smiley");
    smiley.classList.remove("face_down");
}

function handleTileClick(event) {
    // Left Click
    if (event.type == "mousedown") {
        document.getElementById("smiley").classList.add("face_limbo");
    } else if (event.which === 1 && event.type == "mouseup") {
        document.getElementById("smiley").classList.remove("face_limbo");

        if (event.target.classList.contains("flag") == false) {
            //start the timer on first click on non flagged tile
            if (timeSet == false) {
                startTimer();
                timeSet = true;
            }

            //add mines randomly first
            if (setMine == false) {
                setMines(mineAmount);
            }
        }

        //game over when user clicks on a mine
        if (event.target.getAttribute("mined") == "true" &&
        event.target.classList.contains("flag") == false) {
            event.target.classList.add("mine_hit");
            handleGameOver();
        } else if (event.target.getAttribute("mined") == "false" &&
        event.target.classList.contains("flag") == false) {
            //when user clicks on a non mine tile
            var currentRow = +event.target.getAttribute('row');
            var currentCol = +event.target.getAttribute('column');
            var adjacentMine = +event.target.getAttribute("adjacent_mine");
            revealTile(currentRow, currentCol, adjacentMine);
            checkVictory();
        }
    }
    // Middle Click
    else if (event.which === 2 && event.type == "mouseup") {
        document.getElementById("smiley").classList.remove("face_limbo");

        //check if user clicked on a numbered tile
        if (+event.target.getAttribute("adjacent_mine") > 0 && event.target.classList.contains("hidden") == false) {
            handleMiddleClick();
        }

        checkVictory();
    }
    // Right Click
    else if (event.which === 3 && event.type == "mouseup") {
        document.getElementById("smiley").classList.remove("face_limbo");
        var currentRow = +event.target.getAttribute('row');
        var currentCol = +event.target.getAttribute('column');

        if (event.target.classList.contains("flag") == false && event.target.classList.contains("hidden") == true) {
            event.target.classList.add("flag");
            document.getElementById("flagCount").innerHTML--;

            //after setting a flag, increment adjacent_flag attribute around it
            incrementAdjacentFlags(currentRow, currentCol);
        } else if (event.target.classList.contains("flag") == true) {
            event.target.classList.remove("flag");
            document.getElementById("flagCount").innerHTML++;

            //after removing a flag, decrement adjacent_flag attribute around it
            decrementAdjacentFlags(currentRow, currentCol);
        }
    }
}

function handleMiddleClick() {
    var currentRow = +event.target.getAttribute('row');
    var currentCol = +event.target.getAttribute('column');
    var mine_triggered = 0;

    //check if number on tile is equal to its number of adjacent flags
    //then reveal non flagged adjacent tiles
    if (event.target.getAttribute("adjacent_mine") == event.target.getAttribute("adjacent_flag")) {
        //North West
        if (currentRow != 0 && currentCol != 0) {
            var adjacentMine = +grid2d[currentRow-1][currentCol-1].getAttribute("adjacent_mine");
            if (grid2d[currentRow-1][currentCol-1].getAttribute("mined") == "true" && 
            grid2d[currentRow-1][currentCol-1].classList.contains("flag") == false) {
                grid2d[currentRow-1][currentCol-1].classList.add("mine_hit");
                mine_triggered++;
            } else if (grid2d[currentRow-1][currentCol-1].classList.contains("flag") == false &&
            grid2d[currentRow-1][currentCol-1].classList.contains("hidden") == true) {
                if (adjacentMine > 0) {
                    grid2d[currentRow-1][currentCol-1].classList.add("tile_" + adjacentMine);
                }
                grid2d[currentRow-1][currentCol-1].classList.remove("hidden");
                noMineTiles++;
            }
        }
        
        //North
        if (currentRow != 0) {
            var adjacentMine = +grid2d[currentRow-1][currentCol].getAttribute("adjacent_mine");
            if (grid2d[currentRow-1][currentCol].getAttribute("mined") == "true" && 
            grid2d[currentRow-1][currentCol].classList.contains("flag") == false) {
                grid2d[currentRow-1][currentCol].classList.add("mine_hit");
                mine_triggered++;
            } else if (grid2d[currentRow-1][currentCol].classList.contains("flag") == false &&
            grid2d[currentRow-1][currentCol].classList.contains("hidden") == true) {
                if (adjacentMine > 0) {
                    grid2d[currentRow-1][currentCol].classList.add("tile_" + adjacentMine);
                }
                grid2d[currentRow-1][currentCol].classList.remove("hidden");
                noMineTiles++;
            }
        }

        //North East
        if (currentRow != 0 && currentCol != columns-1) {
            var adjacentMine = +grid2d[currentRow-1][currentCol+1].getAttribute("adjacent_mine");
            if (grid2d[currentRow-1][currentCol+1].getAttribute("mined") == "true" && 
            grid2d[currentRow-1][currentCol+1].classList.contains("flag") == false) {
                grid2d[currentRow-1][currentCol+1].classList.add("mine_hit");
                mine_triggered++;
            } else if (grid2d[currentRow-1][currentCol+1].classList.contains("flag") == false &&
            grid2d[currentRow-1][currentCol+1].classList.contains("hidden") == true) {
                if (adjacentMine > 0) {
                    grid2d[currentRow-1][currentCol+1].classList.add("tile_" + adjacentMine);
                }
                grid2d[currentRow-1][currentCol+1].classList.remove("hidden");
                noMineTiles++;
            }
        }

        //West
        if (currentCol != 0) {
            var adjacentMine = +grid2d[currentRow][currentCol-1].getAttribute("adjacent_mine");
            if (grid2d[currentRow][currentCol-1].getAttribute("mined") == "true" && 
            grid2d[currentRow][currentCol-1].classList.contains("flag") == false) {
                grid2d[currentRow][currentCol-1].classList.add("mine_hit");
                mine_triggered++;
            } else if (grid2d[currentRow][currentCol-1].classList.contains("flag") == false &&
            grid2d[currentRow][currentCol-1].classList.contains("hidden") == true) {
                if (adjacentMine > 0) {
                    grid2d[currentRow][currentCol-1].classList.add("tile_" + adjacentMine);
                }
                grid2d[currentRow][currentCol-1].classList.remove("hidden");
                noMineTiles++;
            }
        }
        
        //East
        if (currentCol != columns-1) {
            var adjacentMine = +grid2d[currentRow][currentCol+1].getAttribute("adjacent_mine");
            if (grid2d[currentRow][currentCol+1].getAttribute("mined") == "true" && 
            grid2d[currentRow][currentCol+1].classList.contains("flag") == false) {
                grid2d[currentRow][currentCol+1].classList.add("mine_hit");
                mine_triggered++;
            } else if (grid2d[currentRow][currentCol+1].classList.contains("flag") == false &&
            grid2d[currentRow][currentCol+1].classList.contains("hidden") == true) {
                if (adjacentMine > 0) {
                    grid2d[currentRow][currentCol+1].classList.add("tile_" + adjacentMine);
                }
                grid2d[currentRow][currentCol+1].classList.remove("hidden");
                noMineTiles++;
            }
        }

        //South West
        if (currentRow != rows-1 && currentCol != 0) {
            var adjacentMine = +grid2d[currentRow+1][currentCol-1].getAttribute("adjacent_mine");
            if (grid2d[currentRow+1][currentCol-1].getAttribute("mined") == "true" && 
            grid2d[currentRow+1][currentCol-1].classList.contains("flag") == false) {
                grid2d[currentRow+1][currentCol-1].classList.add("mine_hit");
                mine_triggered++;
            } else if (grid2d[currentRow+1][currentCol-1].classList.contains("flag") == false &&
            grid2d[currentRow+1][currentCol-1].classList.contains("hidden") == true) {
                if (adjacentMine > 0) {
                    grid2d[currentRow+1][currentCol-1].classList.add("tile_" + adjacentMine);
                }
                grid2d[currentRow+1][currentCol-1].classList.remove("hidden");
                noMineTiles++;
            }
        }

        //South
        if (currentRow != rows-1) {
            var adjacentMine = +grid2d[currentRow+1][currentCol].getAttribute("adjacent_mine");
            if (grid2d[currentRow+1][currentCol].getAttribute("mined") == "true" && 
            grid2d[currentRow+1][currentCol].classList.contains("flag") == false) {
                grid2d[currentRow+1][currentCol].classList.add("mine_hit");
                mine_triggered++;
            } else if (grid2d[currentRow+1][currentCol].classList.contains("flag") == false &&
            grid2d[currentRow+1][currentCol].classList.contains("hidden") == true) {
                if (adjacentMine > 0) {
                    grid2d[currentRow+1][currentCol].classList.add("tile_" + adjacentMine);
                }
                grid2d[currentRow+1][currentCol].classList.remove("hidden");
                noMineTiles++;
            }
        }

        //South East
        if (currentRow != rows-1 && currentCol != columns-1) {
            var adjacentMine = +grid2d[currentRow+1][currentCol+1].getAttribute("adjacent_mine");
            if (grid2d[currentRow+1][currentCol+1].getAttribute("mined") == "true" && 
            grid2d[currentRow+1][currentCol+1].classList.contains("flag") == false) {
                grid2d[currentRow+1][currentCol+1].classList.add("mine_hit");
                mine_triggered++;
            } else if (grid2d[currentRow+1][currentCol+1].classList.contains("flag") == false &&
            grid2d[currentRow+1][currentCol+1].classList.contains("hidden") == true) {
                if (adjacentMine > 0) {
                    grid2d[currentRow+1][currentCol+1].classList.add("tile_" + adjacentMine);
                }
                grid2d[currentRow+1][currentCol+1].classList.remove("hidden");
                noMineTiles++;
            }
        }

        //Game over if middle click triggered any mines
        if (mine_triggered > 0) {
            handleGameOver();
        }
    }
}

function revealTile(row, col, adjacentMine) {
    //if tile is adjacent to any mines, not revealed yet and not flagged, reveal it
    if (adjacentMine > 0 || grid2d[row][col].classList.contains("hidden") == false) {
        if (grid2d[row][col].classList.contains("tile_" + adjacentMine) == false && 
        grid2d[row][col].classList.contains("hidden") == true &&
        grid2d[row][col].classList.contains("flag") == false) {
            grid2d[row][col].classList.add("tile_" + adjacentMine);
            grid2d[row][col].classList.remove("hidden");
            noMineTiles++;
        }
    } else if (adjacentMine == 0 && grid2d[row][col].classList.contains("flag") == false) {
        //if tile is not adjacent to any mines and not flagged, reveal it and call its adjacent tiles recursively
        grid2d[row][col].classList.remove("hidden");
        noMineTiles++;

        //North West
        if (row != 0 && col != 0) {
            revealTile(row-1, col-1, +grid2d[row-1][col-1].getAttribute("adjacent_mine"));
        }

        //North
        if (row != 0) {
            revealTile(row-1, col, +grid2d[row-1][col].getAttribute("adjacent_mine"));
        }
        
        //North East
        if (row != 0 && col != columns-1) {
            revealTile(row-1, col+1, +grid2d[row-1][col+1].getAttribute("adjacent_mine"));
        }

        //West
        if (col != 0) {
            revealTile(row, col-1, +grid2d[row][col-1].getAttribute("adjacent_mine"));
        }

        //East
        if (col != columns-1) {
            revealTile(row, col+1, +grid2d[row][col+1].getAttribute("adjacent_mine"));
        }

        //South West
        if (row != rows-1 && col != 0) {
            revealTile(row+1, col-1, +grid2d[row+1][col-1].getAttribute("adjacent_mine"));
        }

        //South
        if (row != rows-1) {
            revealTile(row+1, col, +grid2d[row+1][col].getAttribute("adjacent_mine"));
        }

        //South East
        if (row != rows-1 && col != columns-1) {
            revealTile(row+1, col+1, +grid2d[row+1][col+1].getAttribute("adjacent_mine"));
        }
    }
}

function decrementAdjacentFlags(currentRow, currentCol) {
    //North West
    if (currentRow != 0 && currentCol != 0) {
        var adjFlag = grid2d[currentRow-1][currentCol-1].getAttribute("adjacent_flag");
        adjFlag = (+adjFlag) - 1;
        grid2d[currentRow-1][currentCol-1].setAttribute("adjacent_flag", adjFlag);
    }
    
    //North
    if (currentRow != 0) {
        var adjFlag = grid2d[currentRow-1][currentCol].getAttribute("adjacent_flag");
        adjFlag = (+adjFlag) - 1;
        grid2d[currentRow-1][currentCol].setAttribute("adjacent_flag", adjFlag);
    }

    //North East
    if (currentRow != 0 && currentCol != columns-1) {
        var adjFlag = grid2d[currentRow-1][currentCol+1].getAttribute("adjacent_flag");
        adjFlag = (+adjFlag) - 1;
        grid2d[currentRow-1][currentCol+1].setAttribute("adjacent_flag", adjFlag);
    }

    //West
    if (currentCol != 0) {
        var adjFlag = grid2d[currentRow][currentCol-1].getAttribute("adjacent_flag");
        adjFlag = (+adjFlag) - 1;
        grid2d[currentRow][currentCol-1].setAttribute("adjacent_flag", adjFlag);
    }
    
    //East
    if (currentCol != columns-1) {
        var adjFlag = grid2d[currentRow][currentCol+1].getAttribute("adjacent_flag");
        adjFlag = (+adjFlag) - 1;
        grid2d[currentRow][currentCol+1].setAttribute("adjacent_flag", adjFlag);
    }

    //South West
    if (currentRow != rows-1 && currentCol != 0) {
        var adjFlag = grid2d[currentRow+1][currentCol-1].getAttribute("adjacent_flag");
        adjFlag = (+adjFlag) - 1;
        grid2d[currentRow+1][currentCol-1].setAttribute("adjacent_flag", adjFlag);
    }

    //South
    if (currentRow != rows-1) {
        var adjFlag = grid2d[currentRow+1][currentCol].getAttribute("adjacent_flag");
        adjFlag = (+adjFlag) - 1;
        grid2d[currentRow+1][currentCol].setAttribute("adjacent_flag", adjFlag);
    }

    //South East
    if (currentRow != rows-1 && currentCol != columns-1) {
        var adjFlag = grid2d[currentRow+1][currentCol+1].getAttribute("adjacent_flag");
        adjFlag = (+adjFlag) - 1;
        grid2d[currentRow+1][currentCol+1].setAttribute("adjacent_flag", adjFlag);
    }
}

function incrementAdjacentFlags(currentRow, currentCol) {
    //North West
    if (currentRow != 0 && currentCol != 0) {
        var adjFlag = grid2d[currentRow-1][currentCol-1].getAttribute("adjacent_flag");
        adjFlag = (+adjFlag) + 1;
        grid2d[currentRow-1][currentCol-1].setAttribute("adjacent_flag", adjFlag);
    }
    
    //North
    if (currentRow != 0) {
        var adjFlag = grid2d[currentRow-1][currentCol].getAttribute("adjacent_flag");
        adjFlag = (+adjFlag) + 1;
        grid2d[currentRow-1][currentCol].setAttribute("adjacent_flag", adjFlag);
    }

    //North East
    if (currentRow != 0 && currentCol != columns-1) {
        var adjFlag = grid2d[currentRow-1][currentCol+1].getAttribute("adjacent_flag");
        adjFlag = (+adjFlag) + 1;
        grid2d[currentRow-1][currentCol+1].setAttribute("adjacent_flag", adjFlag);
    }

    //West
    if (currentCol != 0) {
        var adjFlag = grid2d[currentRow][currentCol-1].getAttribute("adjacent_flag");
        adjFlag = (+adjFlag) + 1;
        grid2d[currentRow][currentCol-1].setAttribute("adjacent_flag", adjFlag);
    }
    
    //East
    if (currentCol != columns-1) {
        var adjFlag = grid2d[currentRow][currentCol+1].getAttribute("adjacent_flag");
        adjFlag = (+adjFlag) + 1;
        grid2d[currentRow][currentCol+1].setAttribute("adjacent_flag", adjFlag);
    }

    //South West
    if (currentRow != rows-1 && currentCol != 0) {
        var adjFlag = grid2d[currentRow+1][currentCol-1].getAttribute("adjacent_flag");
        adjFlag = (+adjFlag) + 1;
        grid2d[currentRow+1][currentCol-1].setAttribute("adjacent_flag", adjFlag);
    }

    //South
    if (currentRow != rows-1) {
        var adjFlag = grid2d[currentRow+1][currentCol].getAttribute("adjacent_flag");
        adjFlag = (+adjFlag) + 1;
        grid2d[currentRow+1][currentCol].setAttribute("adjacent_flag", adjFlag);
    }

    //South East
    if (currentRow != rows-1 && currentCol != columns-1) {
        var adjFlag = grid2d[currentRow+1][currentCol+1].getAttribute("adjacent_flag");
        adjFlag = (+adjFlag) + 1;
        grid2d[currentRow+1][currentCol+1].setAttribute("adjacent_flag", adjFlag);
    }
}

function checkVictory() {
    //handle victory based on difficulty mode and maximum number of revealed non mine tiles
    if ((difficulty_mode == "easy" && noMineTiles == 71) || 
    (difficulty_mode == "medium" && noMineTiles == 216) ||
    (difficulty_mode == "hard" && noMineTiles == 381)) {
        handleVictory();
    }
}

function handleVictory() {
    document.getElementById("smiley").classList.add("face_win");
    alert("You Win! Completed Time: " + document.getElementById("timer").innerHTML);

    //remove event listeners on all tiles after the user wins
    //also reveal all mines as flagged
    for (var x = 0; x < rows; x++) {
        for (var y = 0; y < columns; y++) {
            if (grid2d[x][y].getAttribute("mined") == "true" && grid2d[x][y].classList.contains("flag") == false) {
                grid2d[x][y].classList.add("flag");
            }
            grid2d[x][y].removeEventListener("auxclick", function(e) { e.preventDefault(); });
            grid2d[x][y].removeEventListener("contextmenu", function(e) { e.preventDefault(); });
            grid2d[x][y].removeEventListener("mouseup", handleTileClick);
            grid2d[x][y].removeEventListener("mousedown", handleTileClick );
        }
    }

    pauseTimer();
}

function handleGameOver() {
    document.getElementById("smiley").classList.add("face_lose");
    alert("Game Over!");

    //remove event listeners on all tiles after the user loses
    //also reveal all non flagged mines and wrongly placed flags
    for (var x = 0; x < rows; x++) {
        for (var y = 0; y < columns; y++) {
            if (grid2d[x][y].getAttribute("mined") == "true" && grid2d[x][y].classList.contains("flag") == false) {
                grid2d[x][y].classList.add("mine");
            } else if (grid2d[x][y].getAttribute("mined") == "false" && grid2d[x][y].classList.contains("flag") == true) {
                grid2d[x][y].classList.add("mine_marked");
            }
            grid2d[x][y].removeEventListener("auxclick", function(e) { e.preventDefault(); });
            grid2d[x][y].removeEventListener("contextmenu", function(e) { e.preventDefault(); });
            grid2d[x][y].removeEventListener("mouseup", handleTileClick);
            grid2d[x][y].removeEventListener("mousedown", handleTileClick );
        }
    }

    pauseTimer();
}

function setMines(mines) {
    var currentRow = +event.target.getAttribute('row');
    var currentCol = +event.target.getAttribute('column');
    var currRowArr = [currentRow-1, currentRow, currentRow+1];
    var currColArr = [currentCol-1, currentCol, currentCol+1];
    var i = 0;

    while (i < mines) {
        var randomRow = Math.floor(Math.random() * rows);
        var randomCol = Math.floor(Math.random() * columns);

        //the first clicked tile must not be mined nor adjacent to a mine
        if ((!currRowArr.includes(randomRow) || !currColArr.includes(randomCol)) && 
        grid2d[randomRow][randomCol].getAttribute("mined") == "false") {

            //after setting a mine, increment adjacent_mine attribute around its adjacent tiles
            grid2d[randomRow][randomCol].setAttribute("mined", "true");

            //North West
            if (randomRow != 0 && randomCol != 0) {
                var adjMine = grid2d[randomRow-1][randomCol-1].getAttribute("adjacent_mine");
                adjMine = (+adjMine) + 1;
                grid2d[randomRow-1][randomCol-1].setAttribute("adjacent_mine", adjMine);
            }
            
            //North
            if (randomRow != 0) {
                var adjMine = grid2d[randomRow-1][randomCol].getAttribute("adjacent_mine");
                adjMine = (+adjMine) + 1;
                grid2d[randomRow-1][randomCol].setAttribute("adjacent_mine", adjMine);
            }

            //North East
            if (randomRow != 0 && randomCol != columns-1) {
                var adjMine = grid2d[randomRow-1][randomCol+1].getAttribute("adjacent_mine");
                adjMine = (+adjMine) + 1;
                grid2d[randomRow-1][randomCol+1].setAttribute("adjacent_mine", adjMine);
            }

            //West
            if (randomCol != 0) {
                var adjMine = grid2d[randomRow][randomCol-1].getAttribute("adjacent_mine");
                adjMine = (+adjMine) + 1;
                grid2d[randomRow][randomCol-1].setAttribute("adjacent_mine", adjMine);
            }
            
            //East
            if (randomCol != columns-1) {
                var adjMine = grid2d[randomRow][randomCol+1].getAttribute("adjacent_mine");
                adjMine = (+adjMine) + 1;
                grid2d[randomRow][randomCol+1].setAttribute("adjacent_mine", adjMine);
            }

            //South West
            if (randomRow != rows-1 && randomCol != 0) {
                var adjMine = grid2d[randomRow+1][randomCol-1].getAttribute("adjacent_mine");
                adjMine = (+adjMine) + 1;
                grid2d[randomRow+1][randomCol-1].setAttribute("adjacent_mine", adjMine);
            }

            //South
            if (randomRow != rows-1) {
                var adjMine = grid2d[randomRow+1][randomCol].getAttribute("adjacent_mine");
                adjMine = (+adjMine) + 1;
                grid2d[randomRow+1][randomCol].setAttribute("adjacent_mine", adjMine);
            }

            //South East
            if (randomRow != rows-1 && randomCol != columns-1) {
                var adjMine = grid2d[randomRow+1][randomCol+1].getAttribute("adjacent_mine");
                adjMine = (+adjMine) + 1;
                grid2d[randomRow+1][randomCol+1].setAttribute("adjacent_mine", adjMine);
            }

            i++;

            //CHEAT: for displaying tiles with mines
            //grid2d[randomRow][randomCol].classList.add("mine");
            //console.log(grid2d[randomRow][randomCol]);
        }
    }    
    setMine = true;
}

function setDifficulty() {
    var difficultySelector = document.getElementById("difficulty");
    var difficulty = difficultySelector.selectedIndex;

    if (difficulty == 0) {
        columns = 9;
        rows = 9;
        difficulty_mode = 'easy';
        mineAmount = 10;
    } else if (difficulty == 1) {
        columns = 16;
        rows = 16;
        difficulty_mode = 'medium';
        mineAmount = 40;
    } else {
        columns = 30;
        rows = 16;
        difficulty_mode = 'hard';
        mineAmount = 99;
    }
}

function startTimer() {
    timeValue = 0;
    timer = setInterval(onTimerTick, 1000);
}

function onTimerTick() {
    timeValue++;
    updateTimer();
}

function updateTimer() {
    document.getElementById("timer").innerHTML = timeValue;
}

//used to pause timer if user wins or loses
function pauseTimer() {
    if (timer) {
        clearInterval(timer);
    }
}

function stopTimer() {
    if (timer) {
        clearInterval(timer);
        timeValue = 0;
        timeSet = false;
    }
}