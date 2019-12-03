const fs = require('fs');
const csv = require('csvtojson');
const vegalite = require('vega-lite');
const vg = require('vega');

var dataTmp = [];
var dataSet;
let lengthFile;
let file;


function getFileContent(path) {
    fs.readdir(path, (err, files) => {
        file = files;
        lengthFile = files.length;
        if (file.includes('.DS_Store')) {
            let index = file.indexOf('.DS_Store');
            file.splice(index, 1);
        }
        exports.getData();
    });
}

/*
Permet d'importer l'ensemble des data, à ne faire qu'une fois
 */
exports.getData = function () {
    if (!lengthFile && !file) {
        getFileContent('donnees');
        return;
    }
    if (file.length !== 0) {
        fs.readFile('donnees/' + file[0] + '/tweets.csv', 'utf8', (err, data) => {
            if (err) {
                console.log('ERREUR : donnees/' + file[0] + '/tweets.csv est introubable ! Vérifier que votre fichier s’appelle bien tweets.csv');
                file.shift();
                exports.getData();
            } else {
                csv()
                    .fromFile('donnees/' + file[0] + '/tweets.csv')
                    .then((jsonObj) => {
                        dataTmp.push(jsonObj);
                        console.log('donnees/' + file[0] + '/tweets.csv');
                        file.shift();
                        exports.getData();
                    })
            }
        });
    } else {
        fs.writeFileSync('db.json', JSON.stringify(dataTmp));
        console.log('Toute les données ont été importé dans le fichier db.json')
    }
};


exports.topTweet = (args) => {
    let tweetArray = [];
    /*
    On récupère l'ensemble des tweets en les remettants en forme JSON
     */
    for (let i = 0; i < dataSet.length; i++) {
        for (let j = 0; j < dataSet[i].length; j++) {
            tweetArray.push({
                contenu: dataSet[i][j].text,
                user: dataSet[i][j].user_screen_name,
                rtUser: dataSet[i][j].retweet_screen_name,
                rtCount: parseInt(dataSet[i][j].retweet_count),

            });
        }
    }
    // On les tris
    tweetArray = sortJSON(tweetArray, 'rtCount', 'desc');
    let i = 0, k = 0;
    /*
    On enlève les tweets commençant par RT car ils ont le même retweet_count
     */
    let result = '';
    while (k < 10) {
        if (!/^RT/.test(tweetArray[i].contenu)) {
            result += '-' + (k + 1) + ' ; ' + tweetArray[i].rtCount + ' by ' + tweetArray[i].user + ' : ' + tweetArray[i].contenu + '\r\n\r\n';
            i++;
            k++;
        } else {
            i++;
        }
    }
    console.log("Les " + k + " tweets les plus retweetés sont : \n");
    console.log(result);
    if (args.print) {
        exportData(result);
    }
};

exports.numberOfTweetsByHashtag = (args) => {
    let hashtags = args.hashtags;
    let start_date = Date.parse(args.date_debut);
    let end_date = Date.parse(args.date_fin);
    if (!isNaN(start_date) && !isNaN(end_date)) {
        if (end_date > start_date) {
            let k = 0;
            let tweetArray = [];
            for (let i = 0; i < dataSet.length; i++) {
                for (let j = 0; j < dataSet[i].length; j++) {
                    if (dataSet[i][j].hashtags.includes(hashtags)
                        && (Date.parse(dataSet[i][j].created_at) <= end_date && Date.parse(dataSet[i][j].created_at) >= start_date)) {
                        tweetArray.push({
                            contenu: dataSet[i][j].text,
                        });
                        k++;
                    }
                }
            }
            console.log("\nEntre le " + args.date_debut + " et le" + args.date_fin + ", le nombre de tweets comportant le hashtag " + hashtags + " est : " + k)
        } else {
            console.log('La date de début est supérieur à celle de fin')
        }

    } else {
        console.log("\nL'une des dates ne respecte pas le format")
    }
}


exports.byRegion = (args) => {
    let location = args.location;
    let critere = args.critere;
    let k = 0;
    let tweetArray = [];
    var reg = new RegExp(location, 'g'); // g for global
    for (let i = 0; i < dataSet.length; i++) {
        for (let j = 0; j < dataSet[i].length; j++) {
            /*
            On enlève les locations vides
            On sépares les régions et les villes
            On supprime les undefined
            On met des tirets pour remplacer
             */
            if (dataSet[i][j].user_location !== '') {
                var split = dataSet[i][j].user_location.split(',');
                tweetArray.push({
                    location: split[0].replace(' ', '-'),
                    region: split[1] !== undefined ? split[1] : ''
                });
            }
        }
    }
    if (critere === 'pays') {
        tweetArray.forEach(function (el) {
            if (reg.test(el.region)) {
                k++;
            }
        });
        if (k > 0) {
            console.log('Nombre de tweets en ' + location + ' : ' + k);
        } else {
            console.log('Aucun tweet en ' + location);
        }
    } else if (critere === 'ville') {
        tweetArray.forEach(function (el) {
            if (reg.test(el.location)) {
                k++;
            }
        });
        if (k > 0) {
            console.log('Nombre de tweets à ' + location + ' : ' + k);
        } else {
            console.log('Aucun tweet à ' + location);
        }
    } else {
        console.log('Le critère que vous avez rentré est faux, veuillez rentrer pays ou ville. Vous avez entré : ' + critere)
    }
}

exports.hashtagRef = (args) => {

    let hashtags = args.hashtag;
    let interHashtagsArray = [];
    let hashtagsArray = [];

    for (let i = 0; i < dataSet.length; i++) {
        for (let j = 0; j < dataSet[i].length; j++) {
            if (dataSet[i][j].hashtags.includes(hashtags)) {

                interHashtagsArray.push(
                    dataSet[i][j].hashtags
                );
            }
        }
    }

    interHashtagsArray.forEach(function (item, index) {
        inter = item.replace(hashtags, "");
        if (inter != "" && (hashtagsArray.includes(inter) == false)) {

            hashtagsArray.push(inter);

        }
    });

    if (hashtagsArray.length == 0) {

        console.log("Il n'y a aucun hashtag associé à " + hashtags);

    }

    else {
        console.log("\nLes hashtags associés au hashtag " + hashtags + " sont :\n")

        for (i = 0; i < hashtagsArray.length; i++) {

            console.log(hashtagsArray[i]);

        }

        if (args.exportIt) {
            exportData(hashtagsArray);
        }

    }

}

/*
data = le JSON complet
key = la clé de tri
way = asc/desc selon le tri
 */
function sortJSON(data, key, way) {
    return data.sort(function (a, b) {
        var x = a[key];
        var y = b[key];
        if (way === 'asc') {
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        }
        if (way === 'desc') {
            return ((x > y) ? -1 : ((x < y) ? 1 : 0));
        }
    });
}

/*
Data représente les data que l'on veut imprimer dans le fichier
 */
function exportData(data) {
    fs.writeFileSync('export.txt', data);
    console.log('Le fichier export.txt à bien été crée')
}

/*
user_location mentionné
user_urls mentionné
user_verified mentionné
 */
exports.topAuteur = function (args) {
    let tweetArray = [];
    let allUser = [];
    /*
    On récupère l'ensemble des tweets en les remettants en forme JSON
     */
    for (let i = 0; i < dataSet.length; i++) {
        for (let j = 0; j < dataSet[i].length; j++) {
            if (dataSet[i][j].user_location !== '' && dataSet[i][j].user_urls !== '' && dataSet[i][j].user_verified == 'true' && !allUser.includes(dataSet[i][j].user_screen_name)) {
                tweetArray.push({
                    user: dataSet[i][j].user_screen_name,
                    followers: parseInt(dataSet[i][j].user_followers_count)
                });
                allUser.push(dataSet[i][j].user_screen_name)
            }
        }
    }
    sortJSON(tweetArray, 'followers', 'desc');

    console.log("\nLe top 10 des auteurs avec le plus d'information à leur sujet est :\n")

    let result = '', k = 0;
    while (k < 10) {
        result += '-' + (k + 1) + ' : ' + tweetArray[k].user + ' avec ' + tweetArray[k].followers + ' followers \r\n\r\n';
        k++;
    }
    console.log(result);
    if (args.exportIt) {
        exportData(result);
    }
};

exports.filterTweet = function (args) {
    let k = 0; // count the number of occurence
    let exportIt = args.exportIt;
    let tweetArray = [];
    let reg;
    switch (args.critere) {
        case "auteur" :
            for (let i = 0; i < dataSet.length; i++) {
                for (let j = 0; j < dataSet[i].length; j++) {
                    if (dataSet[i][j].user_screen_name === args.element) {
                        tweetArray.push({
                            contenu: dataSet[i][j].text,
                        });
                        k++;
                    }
                }
            }
            break;
        case "mot" :
            reg = new RegExp(args.element, 'g');
            for (let i = 0; i < dataSet.length; i++) {
                for (let j = 0; j < dataSet[i].length; j++) {
                    if (reg.test(dataSet[i][j].text) && !/^RT/.test(dataSet[i][j].text)) {
                        tweetArray.push({
                            contenu: dataSet[i][j].text,
                        });
                        k++;
                    }
                }
            }
            break;
        case "hashtag" :
            reg = new RegExp(args.element, 'g');
            for (let i = 0; i < dataSet.length; i++) {
                for (let j = 0; j < dataSet[i].length; j++) {
                    if (reg.test(dataSet[i][j].hashtags) && !/^RT/.test(dataSet[i][j].text)) {
                        tweetArray.push({
                            contenu: dataSet[i][j].text,
                        });
                        k++;
                    }
                }
            }
            break;
        default :
            console.log("le type n'est pas bon")
    }
    let result = "";
    if (tweetArray.length !== 0) {
        tweetArray.forEach(function (el) {
            result += '- ' + el.contenu + '\r\n\r\n';
        });
        if (args.count) {
            result += 'Il y a eu : ' + k + ' tweets';
        }
        console.log(result);
        if (exportIt) {
            exportData(result)
        }
    } else {
        console.log("Aucun résultat à votre recherche");
    }
};

exports.recupGraph = (args) => {
    if (args.critere === 'pays' || args.critere === 'ville') {
        fs.readFile('db.json', 'utf8', function (err, data) {
            if (err) throw err

            let critereFiltre = args.critere === 'pays' ? 'user_location' : 'place';
            let newArray = [];
            data = JSON.parse(data)
            for (let i = 0; i < data.length; i++) {
                for (let j = 0; j < data[i].length; j++) {
                    if (data[i][j][critereFiltre] !== '') {
                        newArray.push(data[i][j]);
                    }
                }
            }
            newArray = JSON.stringify(newArray);
            fs.writeFileSync('db2.json', newArray);
            graphReg(args)
        });
    } else {
        console.log('Le critere que vous avez rentré est faux, veuillez rentrer pays ou ville. Vous avez entré : ' + critere)
    }

}

function graphReg(args) {

    let critere = args.critere;
    let runtime, view;

        let myChart = {
            "widht": "400", "height": "400",
            "description": "Tweets par " + critere,
            "data": {
                'url': 'db2.json'
            },
            "transform": [
                {"impute": critere === 'pays' ? 'user_location' : "place", "key": "date", "value": "null"}
            ],
            "mark": "bar",
            "encoding": {
                "x": {
                    "field": critere === 'pays' ? 'user_location' : "place",
                    "type": "nominal"
                },
                "y": {
                    "aggregate": 'count',
                    "type": "quantitative",
                    "field": "*"
                },
                "color": {
                    "field": critere === 'pays' ? 'user_location' : "place",
                    "type": "nominal"
                }
            }
        };

        let chart = vegalite.compile(myChart).spec;
        runtime = vg.parse(chart);
        view = new vg.View(runtime).renderer('none').initialize();
        view.toSVG().then(function (svg, err) {
            if (err) throw err;
            fs.writeFileSync("TweetsPar" + critere.charAt(0).toUpperCase() + critere.slice(1) + ".svg", svg);
            console.log("Le fichier TweetsPar" + critere.charAt(0).toUpperCase() + critere.slice(1) + ".svg a été créé avec succès");
        })

}

/* READ OUR JSON FILE
[] : le jour selon le dossier
[] : le tweet
. : le champ souhaité
 */
exports.readJSON = function (callback, args) {
    fs.readFile('db.json', 'utf8', (err, data) => {
        if (err) throw err;
        dataSet = JSON.parse(data);
        if (args) {
            callback(args);
        } else {
            callback()
        }
    });
};
