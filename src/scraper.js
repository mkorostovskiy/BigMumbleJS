'use strict'
// dependencies
const puppeteer = require("puppeteer");
const fs = require("fs");
const chokidar = require("chokidar");
const path = require('./path');
const { msg2json } = require("./myJsonBuilder");

// selectors
const SEL_LOGIN_NAME = "#_b_mar-gbo-dxy-v3d_join_name";
const SEL_LOGIN_CONF = "#room-join";
const SEL_MEETING_INITAL_FORM_BUTTON = "[id^='tippy']";
const SEL_MEETING_MESSAGE = "#layout > div:nth-child(2) > div > div > div > div:nth-child(1) > div";
const SEL_MEETING_MESSAGE_CONTENT = "#layout > div:nth-child(2) > div > div > div:nth-child(1) > div > div > span:last-child > div > div > div > div.content--BYIui > div.messages--ZTkmon > p:last-child";
const SEL_MEETING_MESSAGE_USERNAME = "#layout > div:nth-child(2) > div > div > div:nth-child(1) > div > div > span:last-child > div > div > div > div.content--BYIui > div.meta--ZfU5fg > div";
const SEL_MEETING_MESSAGE_INPUT = "#message-input";
const SEL_MEETING_MESSAGE_SEND = "#layout > div:nth-child(2) > div > form > div > [id^='tippy']";

// constants
const LOGIN_NAME = "BigMumbleJS";
const BBB_INVITE_LINK = "https://bbb.gerwinski.de/b/mar-gbo-dxy-v3d";
const WELCOME_MESSAGE = "Seid gegrüßt, ich bin " + LOGIN_NAME;

// lets
let browser;
let page;

// watcher
const mumble_watcher = chokidar.watch(path.mumbleJSON);

(async () => {
    browser = await puppeteer.launch(
        {
            //headless: false,
            //slowMo: 250
        }
    );
    page = await browser.newPage();
    await page.goto(BBB_INVITE_LINK);
    await page.waitForSelector(SEL_LOGIN_NAME);

    await page.type(SEL_LOGIN_NAME, LOGIN_NAME);
    await page.click(SEL_LOGIN_CONF);

    await page.waitForSelector(SEL_MEETING_INITAL_FORM_BUTTON);
    await page.click(SEL_MEETING_INITAL_FORM_BUTTON);

    await bbbSendMessage(WELCOME_MESSAGE);

    await page.waitForSelector(SEL_MEETING_MESSAGE_USERNAME);

    await page.exposeFunction("msg2json", msg2json);
    await page.exposeFunction("writeFile", async (filePath, username, message) => {
        return new Promise((resolve, reject) => {
            fs.writeFile(filePath, msg2json(username, message), (err) => {
                if (err)
                    console.log(err);
            })
        })
    })
    await page.exposeFunction("stringify", async (obj) => {
        return JSON.stringify(obj);
    })
    await page.evaluate((selMeetingMessage, selMeetingMessageContent, selMeetingMessageUsername, loginName, path) => {
        let counter = 0;
        // observers
        // message observer
        const target_msg = document.querySelector(selMeetingMessage);
        const obs_msg = new MutationObserver(mutations => {
            const mutation = mutations.pop();
            console.log("MutationCount: " + ++counter);
            const dom_username = document.querySelector(selMeetingMessageUsername).textContent;
            const dom_message = document.querySelector(selMeetingMessageContent).textContent;
            if (dom_username != loginName) {
                console.log(dom_username + " + " + dom_message);
                window.writeFile(path.bbbJSON, dom_username, dom_message);
            }
        });
        obs_msg.observe(target_msg, {
            // observer options
            subtree: true,
            childList: true,
        });
    }, SEL_MEETING_MESSAGE, SEL_MEETING_MESSAGE_CONTENT, SEL_MEETING_MESSAGE_USERNAME, LOGIN_NAME, path)
        .catch(err => console.log(err));
})();

async function bbbSendMessage(messageTextContent) {
    await page.type(SEL_MEETING_MESSAGE_INPUT, messageTextContent);
    await page.click(SEL_MEETING_MESSAGE_SEND);
};

mumble_watcher.on('change', () => {
    const data = fs.readFileSync(path.mumbleJSON, 'utf-8');
    const obj = JSON.parse(data);
    if (obj.username == "master_of_puppets") {
        if (obj.message == "end") {
            mumble_watcher.close();
            bbbSendMessage("Auf Wiedersehen")
                .then(() => browser.close())
                .catch(err => console.log(err));
        }
    }
    else {
        bbbSendMessage(obj.username + ": " + obj.message)
            .catch(err => console.log(err));
    }

});

