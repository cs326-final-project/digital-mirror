const router = require("express").Router();

const RedditDataModel = require("../models/redditData");
const FacebookDataModel = require("../models/facebookData");
const getUser = require("../api/getUser");

var Sentiment = require('sentiment');
var sentiment = new Sentiment();

router.get("/analyse", async (req, res) => {

    let results=[];
    const user = await getUser(req);

    if(!user){
        res.sendStatus(404);
    }
    const uid = user.id;
    // query reddit data for user
    let redditdata;
    try {
        redditdata = await RedditDataModel.findOne({userID:uid});
    } catch(error){
        console.log("error getting reddit data");
        console.log(error);
    }
    let allwords={};
    if (redditdata) {
        // console.log("HAHAHA WE FOUND THE REDDIT DATA");
        for (let foo of [redditdata.comments,redditdata.submissions]){
            for (let item of foo) {
                // remove punctuation, split string into array of words
                let words = item.text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").split(" ");
                // count word frequency
                for (let word of words){
                    if (allwords[word]){
                        allwords[word]+=1; // add 1 to count
                    }else{
                        allwords[word] =1; // init count to 1
                    }
                }
            }
        }

    }



    // query facebook data for user
     // query reddit data for user
     let fbdata;
     try {
         fbdata = await FacebookDataModel.findOne({userID:uid});
     } catch(error){
         console.log("error getting facebook data");
         console.log(error);
     }
     if (fbdata) {
        //  console.log("HAHAHA WE FOUND THE facebook DATA");
         for (let post of fbdata.posts){
            let words = post.message.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").split(" ");
            for (let word of words){
                if (allwords[word]){
                    allwords[word]+=1; // add 1 to count
                }else{
                    allwords[word] =1; // init count to 1
                }
            }
         }

     }

    // transform redditwords --> words like this
    //  {word: "Hello", count: 3},
    for (let word of Object.keys(allwords)){
        results.push({"word":word, "count":allwords[word]});
    }

    let allPosts = "";
    if (redditdata) {
        for (let foo of [redditdata.comments, redditdata.submissions]) {
            for (let item of foo) {
                allPosts = allPosts.concat(item.text);
            }
        }
    }

    var senti_result = sentiment.analyze(allPosts);
    var sentiNumber = senti_result.score;
    //send response
    res.status(200).json({wordcount: results, score: sentiNumber});

});


module.exports = router;
