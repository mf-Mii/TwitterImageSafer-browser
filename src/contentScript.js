'use strict';
import $ from './jquery';


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Twitter Timeline Monitor
const targetNode = document.querySelector('body');

const monitorConfig = {attributes: true, childList: true, subtree: true};

const callback = function(mutationsList, observer) {
  blockUserTweets();
  blockUsersCell();
  blockUsersMediaOnProfile();
  blockUserProfiles();
}

const observer = new MutationObserver(callback);

observer.observe(targetNode, monitorConfig);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Monitor Handlers
const blockUserTweets = () => {
  $("body").find(`[data-testid="User-Name"]`).each(function() {
    $(this).find(`a[tabindex="-1"][role="link"]`).each(function() {
      //console.log($(this).find('div[dir="ltr"] > span').text());
      if ($(this).find('div[dir="ltr"] > span').text().startsWith('@')) {
        const twUId = $(this).attr("href").substring(1);
        //console.log(`TwitterUser: ${twUId}`);
        if (TIS.API.isGBanUser(twUId)) {
          //console.log(`The TwitterUser ${twUId} is G-Banned.`);
          $(this).find('div[dir="ltr"] > span').css({
            'background-color': '#f00',
            'color': '#333',
          })
          //TwitterのUserID部分取得
          const twArt = $(this).parents('article[data-testid="tweet"]');
          if (twArt !== undefined) TIS.Twitter.BlockTweet(twArt, TIS.Twitter.BLOCK_REASON.USER_GBAN);
        }
      }
    });
  });
}

const blockUsersMediaOnProfile = () => {
  $("body").find('[data-testid="sidebarColumn"]').each(function() {
    $(this).find('> div > div:nth-child(2) > div > div[tabindex="0"] > div > div:nth-child(3) [data-testid="tweetPhoto"]').each(function() {
      const mediaBox = $(this).parents('div[tabindex="0"]').first().find('> div > div:nth-child(3)');
      console.log(mediaBox);
      if (!mediaBox.find('[data-testid="tweetPhoto"]').length) return;
      const twMediaLink = mediaBox.find('[data-testid="tweetPhoto"]').first().parents('a[role="link"]').attr("href");
      const tweetId = twMediaLink.substring(1).split('/')[2];
      //動画リンクからTwitterIDを取得
      const twUId = twMediaLink.substring(1).split('/')[0];
      if (TIS.API.isGBanUser(twUId)) {
        //console.log(`The TwitterUser ${twUId} is G-Banned.`);
        TIS.Twitter.BlockMedias(mediaBox, TIS.Twitter.BLOCK_REASON.USER_GBAN);
      }
    });
  });
}

const blockUsersCell = () => {
  $("body").find(`[data-testid="UserCell"]`).each(function() {
    $(this).find('a[role="link"][tabindex="-1"]').each(function() {
      if ($(this).find('div[dir="ltr"] > span').text().startsWith('@')) {
        const twUId = $(this).attr("href").substring(1);
        //console.log(`TwitterUser: ${twUId}`);
        if (TIS.API.isGBanUser(twUId)) {
          //console.log(`The TwitterUser ${twUId} is G-Banned.`);
          $(this).css('background-color', '#f00');
          $(this).find('span').css('color', '#333');
          const twUser = $(this).parents('div[data-testid="UserCell"]').first();
          if (twUser !== undefined) TIS.Twitter.BlockUser(twUser, TIS.Twitter.BLOCK_REASON.USER_GBAN);
        }
        else if(twUId.endsWith('_')) {
          $(this).css('background-color', '#ff0');

        }
      }
    });
  });
}

const blockUserProfiles = () => {
  $('div[data-testid]').each(function ()  {
    //console.log($(this));
    if ($(this).attr("data-testid") && $(this).attr("data-testid").endsWith('-follow')) {
      const twUid = $(this).attr('aria-label').split('@')[1];
      if (TIS.API.isGBanUser(twUid)) {
        console.log(`The TwitterUser ${twUid} is G-Banned.`)
        $(this).after('<button class="TIS-DisabledFollow-btn">フォローはできません</button>');
        $(this).remove();
      }else {
        if ($(this).attr('data-tis-has-report-btn') === 'true') return;
        $(this).attr('data-tis-has-report-btn', 'true');

        const btnId = TIS.Twitter._InsertElementVariables.buttonHandlersCount++;
        //ハンドラ作成
        const reportBtn = `
          <div class="TIS-ReportUser">
            <button class="TIS-ReportUser-btn" data-tis-btn="report-user_${btnId}">GBAN報告</button>
          </div>
        `;
        $(this).before(reportBtn);
        $(`[data-tis-btn="report-user_${btnId}"]`).on('click', function() {
          if (TIS.API.isReportedUser(twUid)) return;
          TIS.API.reportUser(twUid);
        });
      }
    }
  })
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Twitter Image Safer APIs
let blacklistCache = {
  user: ['xxxxxsaki_', 'xxxxxsaki__', 'Rara_holo_pad_', 'green_apple_xx_', 'Q0S_Rimu__', 'rin707523_', 'sirayuri_1_', 'ichigo_pappar__', 'marimain91_', 'madiilso_', 'sarukiti_se_', 'KotoriMforever_', '052ysk_'],
  myReport: {
    user: [],
    tweet: [],
    media: []
  },
  imageUrl: [],
  imageHash: []
};

const TIS = {
  API: {
    isGBanUser: (userId) => {
      return blacklistCache.user.includes(userId)
    },
    //仮プログラム
    isReportedUser: (userId) => {
      return blacklistCache.myReport.user.includes(userId)
    },
    reportUser: (userId) => {
      console.log(`Reported User: ${userId}`);
      blacklistCache.myReport.user.push(userId);
    }
  },
  Twitter: {
    _InsertElementVariables: {
      COMMON_CSS: ".TIS-Box { display: inline-block; width: 90%; margin: 5%; background: #f99; border-radius: 5px; padding: 5px; border: 1px solid #f00; color: #333; font-size: 16px; font-weight: bold; }.TIS-Box span.credit {font-size: 12px; font-weight: normal; color: #666; }.TIS-Restore-btn {float: right;border: 1px solid red;background: #f00;color: #fff;font-weight: bold;padding: 5px 7px;border-radius: 20px;transition: .3s;}.TIS-Restore-btn:hover {background: #fff;color: #f00;} .TIS-DisabledFollow-btn {float: right;border: 1px solid #555;background: #aaa;color: #000;font-weight: bold;padding: 5px 7px;border-radius: 20px;}  .TIS-ReportUser-btn {float: right;border: 1px solid #f00;background: #ff0;color: #000;font-weight: bold;padding: 5px 7px;border-radius: 20px;cursor:pointer;transition: .3s;} .TIS-ReportUser-btn:hover {background: #f00;color: #fff;}",
      COMMON_HTML: "<div class='TIS-Box'><p>%MESSAGE%</p><span class='credit'>Twitter Image Sasfer</span><button id='%TIS_BLOCKED_RESTORE_BUTTON_NO%' class='TIS-Restore-btn'>危険を承知で表示</button></div>",
      USER_GBAN: {
        text: 'このツイートのユーザーはGBanされています。',
        media: 'このメディアのユーザーはGBanされています。',
        link: 'このリンクのユーザーはGBanされています。',
        user: 'このユーザーはGBanされています。',
      },
      OTHER: {
        text: "このツイートは有害なコンテンツを含む危険があります",
        media: "このメディアは有害なコンテンツを含む危険があります",
        link: 'このリンクは有害なコンテンツを含む危険があります',
        user: 'このユーザーは有害なコンテンツを含む危険があります',
      },
      deletedElements: [],
      buttonHandlersCount: 0,
    },
    BLOCK_REASON: {
      USER_GBAN: 'USER_GBAN',
    },
    BlockTweet: (tweetArticle, reason) => {
      if (tweetArticle.attr('data-tis-blocked')==='true') {
        return;
      }
      if (tweetArticle.attr('data-tis-bypass')==='true') {
        //console.log('This tweet is bypassed.')
        return;
      }
      //console.log(tweetArticle);
      if (TIS.Twitter._InsertElementVariables[reason]===undefined)
        reason = 'OTHER';

      //tweetArticle.find('div[data-testid="tweetText"],div[data-testid="tweetPhoto"],div[data-testid="card.wrapper"]').each(function() {
      let elemTotal = 0;
      let elemCurrent = 0;
      const swapArticle = function(delTarget, isLarge = false) {
        //いいね,RTボタンを完全消去
        let elemType = 'text';
        //console.log(`ArticleHiding: ${elemCurrent}/${elemTotal-1}`);
        //console.log({delTarget});
        if (elemCurrent === elemTotal-1) {
          delTarget.remove();
          return;
        }
        elemCurrent++;
        if (isLarge) {
          delTarget.children('div').last().remove();
          delTarget.append('<div class="TIS-Box"><p>拡散はできません</p><span class="credit">Twitter Image Sasfer</span></div>');
        }
        //console.log(delTarget.attr('data-testid'));
        if (delTarget.find('div[data-testid]').last().attr('data-testid')==='tweetPhoto') {
          //delTarget = delTarget.parents('div[aria-labelledby][id]').last();
          //delTarget = delTarget.closest('a');
          //console.log('delTarget is changed to parents.');
          //console.log(delTarget);
          //console.log('This is media.');
          elemType = 'media';
        }
        if (delTarget.find('div[data-testid]').attr('data-testid') && delTarget.find('div[data-testid]').attr('data-testid').toString().startsWith('card.')) {
          elemType = 'link';
        }
        const blockID = TIS.Twitter._InsertElementVariables.deletedElements.length;
        let blockedMessage = TIS.Twitter._InsertElementVariables.COMMON_HTML
          .replace('%MESSAGE%', TIS.Twitter._InsertElementVariables[reason][elemType])
          .replace('%TIS_BLOCKED_RESTORE_BUTTON_NO%', `TIS_BLOCKED_RESTORE_BUTTON_${blockID}`);
        delTarget.after(blockedMessage);
        const insertedBlockMessage = tweetArticle.find('div.TIS-Box').last();
        $(`button#TIS_BLOCKED_RESTORE_BUTTON_${TIS.Twitter._InsertElementVariables.deletedElements.length}`).on('click', function() {
          //console.log(`TIS_BLOCKED_RESTORE_BUTTON_${blockID} clicked.`)
          const restoreElem = TIS.Twitter._InsertElementVariables.deletedElements[blockID];
          //console.log({insertedBlockMessage, restoreElem});
          insertedBlockMessage.before(restoreElem);
          insertedBlockMessage.remove();
        });
        TIS.Twitter._InsertElementVariables.deletedElements.push(delTarget);
        delTarget.remove();
      }
      tweetArticle.find('> div > div > div:nth-child(2) > div:nth-child(2) > div:not(:nth-child(1))').each(() => elemTotal++);
      tweetArticle.find('> div > div > div:nth-child(2) > div:nth-child(2) > div:not(:nth-child(1))').each(function () {
        const target = $(this);
        swapArticle(target, false)
      });
      tweetArticle.find('> div > div > div:nth-child(2) > div:nth-child(3)').each(function () {swapArticle($(this), true)});
      tweetArticle.find('> div > div > div:nth-child(3)').each(function () {swapArticle($(this), true)});
      tweetArticle.attr('data-tis-bypass', 'true');
    },
    BlockUser: (userCell, reason) => {
      if (userCell.attr('data-tis-blocked')==='true') {
        return;
      }
      if (userCell.attr('data-tis-bypass')==='true') {
        //console.log('This user is bypassed.')
        return;
      }
      //console.log('BlockUser called.');
      //フォローボタン無効化
      /*
      //別の箇所でやっているのでここでは不要
      userCell.find('div[aria-label][role="button"][tabindex="0"]').each(function() {
        if ($(this).attr('data-testid').endsWith('-follow')) {
          $(this).after('<button class="TIS-DisabledFollow-btn">フォローはできません</button>');
          $(this).remove();
        }
      });

       */
      const blockID = TIS.Twitter._InsertElementVariables.deletedElements.length;
      let blockedMessage = TIS.Twitter._InsertElementVariables.COMMON_HTML
        .replace('%MESSAGE%', TIS.Twitter._InsertElementVariables[reason]['user'])
        .replace('%TIS_BLOCKED_RESTORE_BUTTON_NO%', `TIS_BLOCKED_RESTORE_BUTTON_${blockID}`);
      userCell.append(blockedMessage);
      const delElem = userCell.children('div').first();
      const insertedBlockMessage = userCell.find('div.TIS-Box').last();
      $(`button#TIS_BLOCKED_RESTORE_BUTTON_${TIS.Twitter._InsertElementVariables.deletedElements.length}`).on('click', function() {
        //console.log(`TIS_BLOCKED_RESTORE_BUTTON_${blockID} clicked.`)
        const restoreElem = TIS.Twitter._InsertElementVariables.deletedElements[blockID];
        //console.log({insertedBlockMessage, restoreElem});
        insertedBlockMessage.before(restoreElem);
        insertedBlockMessage.remove();
        userCell.attr('data-tis-bypassed', 'true');
      });
      TIS.Twitter._InsertElementVariables.deletedElements.push(delElem);
      delElem.remove();
      userCell.attr('data-tis-blocked', 'true');
    },
    BlockMedias: (elem, reason) => {
      if (elem.attr('data-tis-blocked')==='true') {
        return;
      }
      if (elem.attr('data-tis-bypass')==='true') {
        //console.log('This user is bypassed.')
        return;
      }
      console.log('BlockMedias called.')
      const blockID = TIS.Twitter._InsertElementVariables.deletedElements.length;
      let blockedMessage = TIS.Twitter._InsertElementVariables.COMMON_HTML
        .replace('%MESSAGE%', TIS.Twitter._InsertElementVariables[reason]['media'])
        .replace('%TIS_BLOCKED_RESTORE_BUTTON_NO%', `TIS_BLOCKED_RESTORE_BUTTON_${blockID}`);
      elem.append(blockedMessage);
      const delElem = elem.children('div').first();
      const insertedBlockMessage = elem.find('div.TIS-Box').last();
      $(`button#TIS_BLOCKED_RESTORE_BUTTON_${TIS.Twitter._InsertElementVariables.deletedElements.length}`).on('click', function() {
        console.log(`TIS_BLOCKED_RESTORE_BUTTON_${blockID} clicked.`)
        const restoreElem = TIS.Twitter._InsertElementVariables.deletedElements[blockID];
        //console.log({insertedBlockMessage, restoreElem});
        insertedBlockMessage.before(restoreElem);
        insertedBlockMessage.remove();
        elem.attr('data-tis-bypassed', 'true');
      });
      TIS.Twitter._InsertElementVariables.deletedElements.push(delElem);
      delElem.remove();
      elem.attr('data-tis-blocked', 'true');
    },
  }
};






////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Twitter OnLoad

console.log('Inserting CSS...');
$("head").append(`<style>${TIS.Twitter._InsertElementVariables.COMMON_CSS}</style>`);
