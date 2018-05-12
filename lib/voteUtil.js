function parseUrlParam() {
  var newQuery = location.search.replace('?', '');
  var queryObj = {};
  if (newQuery) {
    var queryList = newQuery.split('&');
    for (var i = 0; i < queryList.length; i++) {
      var item = queryList[i].split('=');
      queryObj[item[0]] = decodeURIComponent(item[1]);
    }
  }
  return queryObj;
}

function showLoading(option) {
  var _innerHtml = '';
  if (option && option.tip) {
    _innerHtml = '<p class="text-error">' + option.tip + '</p>';
  }
  var _html = '<div class="loading-mask" id="j-mask-loading"><div class="inner"><img class="loading-img" src="http://s.stu.126.net/res/images/ui/loading.gif">' + _innerHtml + '</div></div>';
  $(document.body).append(_html);
}

function hideLoading() {
  $('#j-mask-loading').remove();
}

var questionSplitFlag = '##*@#*';
var idDescriptionSplitFlag = '&$@@&';
var answersSplitFlag = '**@@*#';

window.util = {
  parseUrlParam: parseUrlParam,
  showLoading: showLoading,
  hideLoading: hideLoading,
  questionSplitFlag: questionSplitFlag,
  idDescriptionSplitFlag: idDescriptionSplitFlag,
  answersSplitFlag: answersSplitFlag,
  dappAddress: 'n1iA1Lq5hQL4Uy2tzsofBSMXYGXgPXaNHv1', // test
  // dappAddress: 'n1gbgW5o8mfF59brEGCu5ssEeipLtWfExCB' // online
}