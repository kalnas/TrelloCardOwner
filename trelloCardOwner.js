
/***********************************************************
div.list-cards
 |_div.list-card
    |__div.list-card-details
        |__a.list-card-title, div.list-card-members
                                |__ div.member
                                      |__ img.member-avatar OR span.member-initials

***********************************************************/
var trelloCardOwner = (function() {
   var instance = {};

   instance.pointsDiv = "<div class='points' style=" +
      "'float: left;" +
       "color: white;" +
       "background-color: darkgreen;" +
       "padding-right: 3px;" +
       "padding-left: 3px;" +
       "border-radius: 3px;" +
       "margin-right: 5px;'> $$ </div>";

   instance.highlightOwner = function(listCard) {
     if (!listCard) {
         return;
     }

     var cardOwner = listCard.querySelector('span.cardOwner');
     if (!cardOwner) {
        var listCardTitle = listCard.querySelector('a.list-card-title');
        if (listCardTitle) {
           var pointsElm = '';

           var titleText =  listCardTitle.innerText;
           var parsePoints = titleText.match(/^\((\d+)\)/);
           var points = undefined;
           if (parsePoints && parsePoints.length > 0) {
             points = parsePoints[0].replace(/[\(\)]/g, '');
           }

           if (!points) {
             points = listCard.querySelector('.badge-points.point-count') &&
                 listCard.querySelector('.badge-points.point-count').innerText;
           }

          if (points) {
             pointsElm = instance.pointsDiv.replace('$$', points);
             var badges = listCard.querySelector('div.badges');
             if (badges) {
                badges.style.visibility = 'hidden';
             }
          }

          listCardTitle.innerHTML = pointsElm + listCardTitle.innerHTML
            .replace(/(\s)(\*)(\w+\b)$/, "<span class='cardOwner' style='visibility: hidden;'>$3</span>");
        }

        cardOwner = listCard.querySelector('span.cardOwner');
     }

     var ownerName = cardOwner && cardOwner.innerHTML;
     var members = listCard.querySelectorAll('div.member');

     [].forEach.call(members, function(member) {
        var img = member.querySelector('img.member-avatar');
        var span = member.querySelector('span.member-initials');

        var title = (img && img.getAttribute('title')) ||
                    (span && span.getAttribute('title'));

        if (ownerName && title && title.toLowerCase().indexOf(ownerName.toLowerCase()) > -1) {
           member.setAttribute('style', 'border: 4px double red');
        } else {
           member.setAttribute('style', '');
        }
     });
  };

  instance.columnObserverConfig = {
    childList: true,
    characterData: false,
    attributes: false,
    subtree: true
  };

  instance.columnObserver = new MutationObserver(function(mutations) {
    var changedListCardTitle = undefined;
    var addedListCard = undefined;
console.log(mutations.length);
    instance.disconnectObserver();

    try {
        for (var i = 0; i < mutations.length; i++) {
            if (mutations[i].target.classList.contains('list-card-title')) {
               changedListCardTitle = mutations[i].target;
               setTimeout(function() {
                  instance.highlightOwner(changedListCardTitle.parentElement.parentElement);
               }, 100);

               break; // only one of these can happen, no need to continue looping
            }

            if (mutations[i].addedNodes && mutations[i].target.classList.contains('list-cards')) {
                if (mutations[i].addedNodes.length > 0
                  && mutations[i].addedNodes[0].classList.contains('list-card')) {
                    addedListCard = mutations[i].addedNodes[0];
                    instance.highlightOwner(addedListCard);
                }
            }
        }
    } finally {
        instance.connectObserver();
    }
  });

  instance.connectObserver = function() {
    var columns = document.querySelectorAll('div.list-cards');

    [].forEach.call(columns, function(column) {
      instance.columnObserver.observe(
          column,
          instance.columnObserverConfig);
    });
  };

  instance.disconnectObserver = function() {
    instance.columnObserver.disconnect();
  };

  instance.changeBoard = function() {
      setTimeout(function() {
        instance.numCards = -1;
        instance.initialize();
     }, 1);
  };

  instance.numCards = -1;
  instance.attempts = 0;
  instance.initialize = function() {
    if (instance.attempts >= 10) {
      return;
    }

    var listCards = document.querySelectorAll('div.list-card');
    if (listCards.length !== instance.numCards) {
       instance.numCards = listCards.length;
       instance.attempts++;
       setTimeout(instance.initialize, 1000);
       return;
    }

    [].forEach.call(listCards, function(listCard) {
      instance.highlightOwner(listCard);
    });

    instance.connectObserver();

    var boardHeader = document.querySelector('a.js-boards-menu');
    if (boardHeader) {
        boardHeader.addEventListener('click', function() {
            var boards = document.querySelectorAll('a.js-open-board');
            [].forEach.call(boards, function(board) {
                board.addEventListener('click', instance.changeBoard);
            } );
        });
    }

    var boardTiles = document.querySelectorAll('a.board-tile');
    [].forEach.call(boardTiles, function(boardTile) {
        boardTile.addEventListener('click', instance.changeBoard);
    } );

  };

  return instance;
})();

trelloCardOwner.initialize();
