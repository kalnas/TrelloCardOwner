
/***********************************************************
div.list-cards
 |_div.list-card
    |__div.list-card-details
        |__a.list-card-title, div.list-card-members
                                |__ div.member
                                      |__ img.member-avatar OR span.member-initials

***********************************************************/
NodeList.prototype.each = function(func) {
    [].forEach.call(this, function(item) {
        func(item);
    } );
};

var defer = function(func) {
    window.setTimeout.apply(window, [func, 500].concat([].slice.call(arguments, 1)));
};

var onVisible = function(options) {
    options.attempts = options.attempts || 0
    if (options.attempts >= 10) {
        return;
    }

    options.parent = options.parent || document;
    if (options.parent.querySelectorAll(options.selector).length == 0) {
        options.attempts++;
        defer(onVisible, options);
        return;
    }

    options.func.apply(options.that, options.args);
};

var refreshTotals = function() {
    document.querySelectorAll('div.list').each(function(list) {
        var pts = 0;
        list.querySelectorAll('div.points').each(function(points) {
            var cardPoints = Number(points.innerHTML.trim());
            pts += (Number.isNaN(cardPoints) ? 0 : cardPoints);
        });

        var newPoints = list.querySelector('div.newPoints');
        if (!newPoints) {
            newPoints = document.createElement("div");
            newPoints.className = 'newPoints';
            newPoints.setAttribute('style', 'float: right; font-weight: bold; margin-top: -20px;');

            var parentHeader = list.querySelector('div.list-header');
            var nameHeader = list.querySelector('h2.list-header-name');
            parentHeader.insertBefore(newPoints, nameHeader);
        }

        newPoints.innerHTML = pts;
    });
};

var pointsDiv = "<div class='points' style=" +
    "'float: left;" +
    " color: black;" +
    " background-color: #d6dadc;" +
    " padding: 0 6px;" +
    " border-radius: 3px;" +
    " margin-right: 5px;'> $$ </div>";

var highlightOwnerAndPoints = function(listCard) {
    if (!listCard) {
        return;
    }

    var listCardTitle = listCard.querySelector('a.list-card-title');
    var pointsElm = '';
    if (listCardTitle) {
        var points = undefined;
        var titleText = listCardTitle.innerText;
        var parsePoints = titleText.match(/^\((\d+)\)/);
        if (parsePoints && parsePoints.length > 0) {
            points = parsePoints[0].replace(/[\(\)]/g, '');
            if (points) {
                pointsElm = pointsDiv.replace('$$', points);
            }
        }
    }

    var cardOwner = listCard.querySelector('span.cardOwner');
    if (!cardOwner || pointsElm) {
        if (listCardTitle) {
            var currPointsDiv = listCardTitle.querySelector('div.points');
            if (currPointsDiv) {
                points = currPointsDiv.innterText;
                listCardTitle.removeChild(currPointsDiv);
            }

            listCardTitle.innerHTML = pointsElm + listCardTitle.innerHTML
                .replace('(' + points + ')', '')
                .replace(/(\s)(\*)(\w+\b)$/, "<span class='cardOwner' style='visibility: hidden;'>$3</span>");
        }

        cardOwner = listCard.querySelector('span.cardOwner');
    }

    var ownerName = cardOwner && cardOwner.innerHTML;
    listCard.querySelectorAll('div.member').each(function(member) {
        var img = member.querySelector('img.member-avatar');
        var span = member.querySelector('span.member-initials');

        var title = (img && img.getAttribute('title')) ||
            (span && span.getAttribute('title'));

        if (ownerName && title && title.toLowerCase().indexOf(ownerName.toLowerCase()) > -1) {
            member.setAttribute('style', 'border: 4px double black;');
        } else {
            member.setAttribute('style', 'margin: 6px;');
        }
    });

    defer(refreshTotals);
};

var connectColumnObserver = function() {
    var columnObserverConfig = {
        childList: true,
        characterData: false,
        attributes: false,
        subtree: true
    };

    document.querySelectorAll('div.list-cards').each(function(column) {
        columnObserver.observe(
            column,
            columnObserverConfig);
    });
};

var pointAnchor =
        "<a style='text-decoration: none;" +
            "background-color: #c4c9cc;" +
            "border-radius: 3px;" +
            "font-size: 1em;" +
            "padding-right: 5px;" +
            "margin-left: 5px;" +
            "padding-left: 5px;' href='#'>$$</a>";

var setupPointSelection = function() {
    var windowHeader = document.querySelector('div.window-header');
    if (!windowHeader) {
        return;
    }

    var pointSelector = windowHeader.querySelector('div.point-selector');
    if (pointSelector) {
        return;
    }

    pointSelector = document.createElement("div");
    pointSelector.className = 'point-selector';

    pointSelector.innerHTML =
        "Points: " +
        pointAnchor.replace('$$', 1) +
        pointAnchor.replace('$$', 2) +
        pointAnchor.replace('$$', 3) +
        pointAnchor.replace('$$', 5) +
        pointAnchor.replace('$$', 8) +
        pointAnchor.replace('$$', 13);

    windowHeader.insertBefore(pointSelector, null);

    // var membersList = document.querySelector('div.js-card-detail-members-list');
    //
    // if (membersList) {
    //     membersList.querySelectorAll('span.member-initials, img.member-avatar').each(function() {
    //
    //     });
    // }


    var setPoints = function() {
        var textArea = document.querySelector('textarea.js-card-detail-title-input');
        textArea.click();
        var titleText = textArea.value;
        titleText = '(' + this.innerHTML + ') ' + titleText.replace(/\(\d+\)\s*/g, '');
        textArea.value = titleText;

        // Clicking away from title text area triggers saving of information entered
        defer(function() {
            var commentBox = document.querySelector('textarea.comment-box-input');
            if (commentBox) {
                commentBox.focus();
                commentBox.setSelectionRange(0, 0);
            }
        });
    };

    windowHeader.querySelectorAll('.point-selector a').each(function(point) {
        point.addEventListener("click", setPoints, false);
    });
};

var hookCardToPointSelector = function() {
    onVisible({
        selector: 'textarea.js-card-detail-title-input',
        func: function() {
            setupPointSelection();
        }
    });
};

var columnObserver = new MutationObserver(function(mutations) {
    columnObserver.disconnect();

    try {
        for (var i = 0; i < mutations.length; i++) {
            if (mutations[i].target.classList.contains('list-card-title') ||
                mutations[i].target.classList.contains('list-card-members')) {
                var changedListCardTitle = mutations[i].target;
                //defer(function() {
                    highlightOwnerAndPoints(changedListCardTitle.parentElement.parentElement);
                //});

                break; // only one of these can happen, no need to continue looping
            }

            if (mutations[i].addedNodes && mutations[i].target.classList.contains('list-cards')) {
                if (mutations[i].addedNodes.length > 0 && mutations[i].addedNodes[0].classList.contains('list-card')) {
                    var addedListCard = mutations[i].addedNodes[0];
                    highlightOwnerAndPoints(addedListCard);
                }
            }
        }

    } finally {
        document.querySelectorAll('div.list-card-details').each(function(cardLink) {
            cardLink.addEventListener('click', hookCardToPointSelector);
        });

        connectColumnObserver();
    }
});

var initialize = function(boardTitle, attempts, numCards) {
    //console.log('initialize: ' + attempts ',' + numCards + ',' + boardTitle);

    var titleAnchor = document.querySelector('a.board-header-btn-name');
    var currentTitle = titleAnchor && titleAnchor.innerText;


    attempts = attempts || 10;
    numCards = numCards || -1;

    if (attempts < 1) {
        return;
    }

    var listCards = document.querySelectorAll('div.list-card');
    if (listCards.length !== numCards || listCards.length === 0 ||
        (boardTitle && boardTitle === currentTitle)) {
        defer(initialize, boardTitle, attempts - 1, listCards.length);
        return;
    }

    listCards.each(function(listCard) {
        highlightOwnerAndPoints(listCard);
    });

    connectColumnObserver();

    var changeBoard = function() {
        console.log('change board: ' + this);
        defer(initialize);
    };

    document.querySelectorAll('a.js-open-board').each(function(boardLink) {
        boardLink.addEventListener('click', changeBoard);
    });

    document.querySelectorAll('a.board-tile').each(function(boardTile) {
        boardTile.addEventListener('click', changeBoard);
    });

    onVisible({
        selector: 'div.list-card-details',
        func: function() {
            document.querySelectorAll('div.list-card-details').each(function(cardLink) {
               cardLink.addEventListener('click', hookCardToPointSelector);
            });
        }
    });
};

initialize();
