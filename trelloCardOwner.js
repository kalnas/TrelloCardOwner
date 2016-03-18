
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
}

var instance = {};

instance.pointsDiv = "<div class='points' style=" +
    "'float: left;" +
    " color: black;" +
    " background-color: #d6dadc;" +
    " padding: 0 6px;" +
    " border-radius: 3px;" +
    " margin-right: 5px;'> $$ </div>";

instance.defer = function(func) {
    window.setTimeout.apply(window, [func, 500].concat([].slice.call(arguments, 1)));
};

instance.refreshTotals = function() {
    document.querySelectorAll('div.list').each(function(list) {
        var pts = 0;
        list.querySelectorAll('div.points').each(function(points) {
            var cardPoints = Number(points.innerHTML.trim());
            pts += (Number.isNaN(cardPoints) ? 0 : cardPoints);
        });

        var parentHeader = list.querySelector('div.list-header');
        var nameHeader = list.querySelector('h2.list-header-name');
        var newPoints = list.querySelector('div.newPoints');

        if (!newPoints) {
            newPoints = document.createElement("div");
            newPoints.className = 'newPoints';
            newPoints.setAttribute('style', 'float: right; font-weight: bold;');
            parentHeader.insertBefore(newPoints, nameHeader);
        }

        newPoints.innerHTML = pts;
    });
};

instance.highlightOwner = function(listCard) {
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
                pointsElm = instance.pointsDiv.replace('$$', points);
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

    instance.defer(instance.refreshTotals);
};

instance.columnObserverConfig = {
    childList: true,
    characterData: false,
    attributes: false,
    subtree: true
};

instance.columnObserver = new MutationObserver(function(mutations) {
    instance.disconnectObserver();

    try {
        for (var i = 0; i < mutations.length; i++) {
            if (mutations[i].target.classList.contains('list-card-title')) {
                var changedListCardTitle = mutations[i].target;
                instance.defer(function() {
                    instance.highlightOwner(changedListCardTitle.parentElement.parentElement);
                    document.querySelectorAll('div.list-card-details').each(function(cardLink) {
                        cardLink.addEventListener('click', instance.hookCardsToPointSelector);
                    });
                });

                break; // only one of these can happen, no need to continue looping
            }

            if (mutations[i].addedNodes && mutations[i].target.classList.contains('list-cards')) {
                if (mutations[i].addedNodes.length > 0 && mutations[i].addedNodes[0].classList.contains('list-card')) {
                    var addedListCard = mutations[i].addedNodes[0];
                    instance.highlightOwner(addedListCard);
                }
            }
        }

    } finally {
        instance.connectObserver();
    }
});

instance.connectObserver = function() {
    document.querySelectorAll('div.list-cards').each(function(column) {
        instance.columnObserver.observe(
            column,
            instance.columnObserverConfig);
    });
};

instance.disconnectObserver = instance.columnObserver.disconnect;

instance.changeBoard = function() {
    instance.defer(instance.initialize);
};

instance.setupPointSelection = function() {
    var editControls = document.querySelector('div.edit-controls');
    var pointSelector = editControls && editControls.querySelector('div.point-selector');
    if (pointSelector) {
        return;
    }

    pointSelector = document.createElement("div");
    pointSelector.className = 'point-selector';
    pointSelector.setAttribute('style', 'float: right; font-weight: bold;');

    pointSelector.innerHTML =
        "Points: " +
        "<a href='#'>1</a>  " +
        "<a href='#'>2</a>  " +
        "<a href='#'>3</a>  " +
        "<a href='#'>5</a>  " +
        "<a href='#'>8</a>  " +
        "<a href='#'>13</a> ";

    editControls.insertBefore(pointSelector, null);

    var setPoints = function() {
        var caller = this;
        instance.defer(function() {
            var textArea = document.querySelector('.card-detail-title textarea.field');
            var titleText = textArea.value;
            titleText = '(' + caller.innerHTML + ') ' + titleText.replace(/\(\d+\)\s*/g, '');
            textArea.value = titleText;
        });
    };

    editControls.querySelectorAll('.point-selector a').each(function(point) {
        point.addEventListener("click", setPoints, false);
    });
};

instance.hookCardsToPointSelector = function() {
    instance.defer(function() {
        document.querySelector("div.card-detail-title").addEventListener("click", function() {
            instance.defer(instance.setupPointSelection);
        });
    });
};

instance.initialize = function(attempts, numCards) {
    if (arguments.length === 0) {
        attempts = 10;
        numCards = -1;
    }

    if (attempts < 1) {
        return;
    }

    var listCards = document.querySelectorAll('div.list-card');
    if (listCards.length !== numCards || listCards.length === 0) {
        instance.defer(instance.initialize, attempts - 1, listCards.length);
        return;
    }

    listCards.each(function(listCard) {
        instance.highlightOwner(listCard);
    });

    instance.connectObserver();

    var boardHeader = document.querySelector('a.js-boards-menu');
    if (boardHeader) {
        boardHeader.addEventListener('click', function() {
            var boards = document.querySelectorAll('a.js-open-board');
            boards.each(function(board) {
                board.addEventListener('click', instance.changeBoard);
            });
        });
    }

    document.querySelectorAll('a.board-tile').each(function(boardTile) {
        boardTile.addEventListener('click', instance.changeBoard);
    });


    instance.defer(function() {
        document.querySelectorAll('div.list-card-details').each(function(cardLink) {
            // TODO should just look for document.querySelector('.card-detail-window')
            cardLink.addEventListener('click', instance.hookCardsToPointSelector);
        });
    });

};

instance.initialize();
