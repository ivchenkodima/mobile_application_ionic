Array.prototype.randomize = function() {
		var i = this.length, j;
		if (i == 0)
			return;
		while (--i) {
			j = Math.floor(Math.random() * (i + 1));
			this.swap(i, j);
		}
		return this;
	};

	Array.prototype.clone = function() {
		return this.slice(0);
	};

	Array.prototype.contains = function(elem) {
		for (var i = 0; i < this.length; ++i)
			if (this[i] == elem)
				return true;
		return false;
	};

	Array.prototype.except = function(other) {
		return this.filter(function(elem) {
			return !other.contains(elem);
		});
	};

	Array.prototype.swap = function(i, j) {
		var tmp = this[i];
		this[i] = this[j];
		this[j] = tmp;
	};

	Array.prototype.deepEquals = function(other) {
		if (this.length != other.length)
			return false;
		for (var i = 0; i < this.length; ++i) {
			if (this[i] != other[i])
				return false;
		}
		return true;
	}

	Array.generate = function(size, generator) {
		var arr = new Array();
		for (var i = 0; i < size; ++i) {
			arr[i] = generator(i);
		}
		return arr;
	};

	function Point(x, y) {
		this.X = x;
		this.Y = y;
	};

	Point.prototype.draw = function(ctx) {
		ctx.beginPath();
		ctx.fillRect(this.X, this.Y, 2, 2);
		ctx.closePath();
	};

	function Line(p1, p2) {
		this.p1 = p1;
		this.p2 = p2;
	}

	Line.prototype.getLength = function() {
		var x = this.p1.X - this.p2.X;
		var y = this.p1.Y - this.p2.Y;
		return Math.sqrt(x * x + y * y);
	}

	Line.prototype.draw = function(ctx) {
		ctx.beginPath();
		ctx.moveTo(this.p1.X, this.p1.Y);
		ctx.lineTo(this.p2.X, this.p2.Y);
		ctx.stroke();
	}

	function CrossoverAlgorithm() {
	};

	CrossoverAlgorithm.prototype.parentNumber = function() {
		return 2;
	}

	CrossoverAlgorithm.prototype.crossover = function(parents) {
		var child = new TSPSolution();
		child.points = parents[0].points;
		var points1 = parents[0].getPointsOrder(), points2 = parents[1]
				.getPointsOrder();
		var breakPoint = Math.floor(Math.random() * points1.length);
		var childPoints = points1.slice(0, breakPoint);
		child.setPointsOrder(childPoints.concat(points2.except(childPoints)));
		return child;
	}

	MultipointCrossoverAlgorithm.prototype = new CrossoverAlgorithm();

	MultipointCrossoverAlgorithm.prototype.constructor = MultipointCrossoverAlgorithm;

	function MultipointCrossoverAlgorithm(pointCount) {
		if (pointCount < 1)
			throw 'PointCount must be >=1';
		this._pointCount = pointCount;
	};

	MultipointCrossoverAlgorithm.prototype.crossover = function(parents) {
		var child = new TSPSolution();
		child.points = parents[0].points;
		var points = [ parents[0].getPointsOrder(), parents[1].getPointsOrder() ];
		var childPoints = points[0].slice(0, Math.floor(Math.random()
				* points[0].length));
		var i = 1;
		for (; i < this._pointCount; ++i) {
			var selectFrom = points[i % 2].except(childPoints);
			childPoints = childPoints.concat(selectFrom.slice(0, Math.floor(Math
					.random()
					* selectFrom.length)));
		}
		childPoints = childPoints.concat(points[i % 2].except(childPoints));
		child.setPointsOrder(childPoints);
		return child;
	}

	function TSPSolution() {
		this._pointsOrder = new Array();
		this._mutable = true;
		this.points = new Array();
		this._length = 0;
	}

	TSPSolution.prototype.setPointsOrder = function(pointsOrder) {
		this._pointsOrder = pointsOrder;
	}

	TSPSolution.prototype.getPointsOrder = function() {
		return this._pointsOrder.clone();
	};

	TSPSolution.prototype.getLines = function() {
		var pointsClone = this.points.clone();
		var lines = new Array();
		for (var i = 0; i < this.points.length - 1; ++i) {
			var p1ix = this._pointsOrder[i];
			var p1 = pointsClone[p1ix];
			if (p1 == undefined) {
				throw 'Dead individual';
			}
			delete pointsClone[p1ix];
			var p2ix = this._pointsOrder[i + 1];
			var p2 = pointsClone[p2ix];
			if (p2 == undefined) {
				throw 'Dead individual';
			}
			lines.push(new Line(p1, p2));
		}
		lines.push(new Line(lines[lines.length - 1].p2,
				this.points[this._pointsOrder[0]]));
		return lines;
	}

	TSPSolution.prototype.getLength = function() {
		if (!this._mutable)
			return this._length;
		var lines = this.getLines();
		var length = 0;
		lines.forEach(function(line) {
			length += line.getLength();
		});
		this._length = length;
		this._mutable = false;
		return length;
	}

	TSPSolution.prototype.mutate = function() {
		this._mutable = true;
		this._length = 0;
		var p1 = Math.floor(Math.random() * this._pointsOrder.length);
		var p2 = Math.floor(Math.random() * this._pointsOrder.length);
		this._pointsOrder.swap(p1, p2);
	}

	TSPSolution.prototype.draw = function(ctx) {
		this.getLines().forEach(function(line) {
			line.draw(ctx);
		});
	}

	TSPSolution.prototype.equals = function(other) {
		return this._pointsOrder.deepEquals(other._pointsOrder);
	}

	function TSPSolver() {
		this._points = new Array();
		this._solutions = new Array();
		this.solved = false;
		this.populationSize = 50;
		this.iterations = 10000;
		this.crossoverAlgorithm = null;
		this.survive = 0.8;
		this.seniorSurvive = 0.1;
	};

	TSPSolver.prototype.getSolutions = function() {
		return this._solutions.clone();
	};

	TSPSolver.prototype.addPoint = function(p) {
		if (!(p instanceof Point))
			throw "Instance of Point expected";
		this._points.push(p);
	}

	TSPSolver.prototype.solve = function() {
		this._points.randomize();
		this._solutions = new Array();
		var pointsSequence = Array.generate(this._points.length, function(i) {
			return i;
		});
		for (var i = 0; i < this.populationSize; ++i) {
			var solution = new TSPSolution();
			solution.points = this._points;
			solution.setPointsOrder(pointsSequence.clone().randomize());
			this._solutions.push(solution);
		}
		var prevAvgLength = 0;
		for (var i = 0; i < this.iterations; ++i) {
			var totalLength = 0;
			this._solutions.forEach(function(s) {
				totalLength += s.getLength();
			});
			var avgLength = totalLength / this._solutions.length;
			if (i > 0 && avgLength >= prevAvgLength) {
				for (var ii = 1; ii < this._solutions.length; ++ii)
					this._solutions[ii].mutate();
				totalLength = 0;
				this._solutions.forEach(function(s) {
					totalLength += s.getLength();
				});
			}
			prevAvgLength = totalLength / this._solutions.length;
			var nextGen = this._solutions.slice(0, Math.floor(this.seniorSurvive
					* this._solutions.length));
			var sLen = this._solutions.length;
			for (var ii = nextGen.length; ii < this.populationSize; ++ii) {
				var parents = new Array();
				for (var iii = 0; iii < this.crossoverAlgorithm.parentNumber(); ++iii) {
					parents.push(this._solutions[Math.floor(Math.random() * sLen)]);
				}
				nextGen.push(this.crossoverAlgorithm.crossover(parents));
			}
			this._solutions = nextGen;
			this._solutions.sort(function(s1, s2) {
				return s1.getLength() - s2.getLength();
			});
			this._solutions = this._solutions.slice(0, Math
					.floor(this.populationSize * this.survive));
		}
		this.solved = true;
		return this._solutions[0];
	}

	TSPSolver.prototype.clearCanvas = function(ctx, width, height) {
		ctx.clearRect(0, 0, width, height);
		this._points.forEach(function(point) {
			point.draw(ctx);
		});
	}

	var canvas, ctx, flag = false, prevX = 0, currX = 0, prevY = 0,
		currY = 0, dot_flag = false, solver = new TSPSolver(),
	 	x = "black", y = 2, w = 0, h = 0;

	var crossoverAlgos = {
		0 : new CrossoverAlgorithm(),
		1 : new MultipointCrossoverAlgorithm(2),
		2 : new MultipointCrossoverAlgorithm(3)
	};
	function init() {
		console.log("init");
		canvas = document.getElementById('can');
		ctx = canvas.getContext("2d");
		w = canvas.width;
		h = canvas.height;

		canvas.addEventListener("mousemove", function(e) {
			findxy('move', e
)		}, false);
		canvas.addEventListener("mousedown", function(e) {
			findxy('down', e)
		}, false);
		canvas.addEventListener("mouseup", function(e) {
			findxy('up', e)
		}, false);
		canvas.addEventListener("mouseout", function(e) {
			findxy('out', e)
		}, false);
	}

	function draw() {
		ctx.beginPath();
		ctx.strokeStyle = x;
		ctx.lineWidth = y;
		ctx.stroke();
		ctx.closePath();
	}

	function erase() {
		var m = confirm("Clear?");
		if (m) {
			clear();
		}
	}

	function clear() {
		ctx.clearRect(0, 0, w, h);
		solver = new TSPSolver();
	}

	function findxy(res, e) {
		if (res == 'down') {
			prevX = currX;
			prevY = currY;
			currX = e.clientX - canvas.offsetLeft;
			currY = e.clientY - canvas.offsetTop;
			solver.addPoint(new Point(currX, currY));
			flag = true;
			dot_flag = true;
			if (dot_flag) {
				ctx.beginPath();
				ctx.fillStyle = x;
				ctx.fillRect(currX, currY, 2, 2);
				ctx.closePath();
				dot_flag = false;
			}
		}
		if (res == 'up' || res == "out") {
			flag = false;
		}
		if (res == 'move') {
			if (flag) {
				prevX = currX;
				prevY = currY;
				currX = e.clientX - canvas.offsetLeft;
				currY = e.clientY - canvas.offsetTop;
				draw();
			}
		}
	}
	function drawSolution(solution) {
		solver.clearCanvas(ctx, w, h);
		solution.draw(ctx);
		document.getElementById('length').value = solution.getLength();
	}
	function cons() {
		solver.populationSize = document.getElementById('maxPopSize').value;
		solver.iterations = document.getElementById('itLimit').value;
		solver.crossoverAlgorithm = crossoverAlgos[document
				.getElementById('crossover').value];
		solver.survive = document.getElementById('survivePercent').value / 100.0;
		solver.seniorSurvive = document.getElementById('seniorSurvivePercent').value / 100.0;
		var solution = solver.solve();
		drawSolution(solution);
	}

	function generate() {
		var np1 = document.getElementById('r1PointCount').value, np2 = document
				.getElementById('r2PointCount').value, r1 = document
				.getElementById('r1').value, dr = document.getElementById('dr').value, theta = document
				.getElementById('theta').value, x0 = w / 2, y0 = h / 2;
		var r2 = r1 * dr, thetaRad = theta * Math.PI / 180;
		clear();
		for (var i = 0; i < np1; ++i) {
			var phi = 2.0 * Math.PI * i / np1;
			solver.addPoint(new Point(x0 + r1 * Math.cos(phi), y0 + r1
					* Math.sin(phi)));
		}
		for (var i = 0; i < np2; ++i) {
			var phi = 2.0 * Math.PI * i / np2 + thetaRad;
			solver.addPoint(new Point(x0 + r2 * Math.cos(phi), y0 + r2
					* Math.sin(phi)));
		}
		solver.clearCanvas(ctx, w, h);
	}
