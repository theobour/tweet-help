const fs = require('fs');
const colors = require('colors');
const Parser = require('./Parser.js');
const vg = require('vega');
const vegalite = require('vega-lite');
const cli = require('caporal');

/*
LIRE AVANT DE COMMENCER :
Chaque fonction doit commencer par : (pour vérifier qu'on a bien importé les fichiers)
        if (fs.existsSync('db.json')) {
            ...
        } else {
            console.log('Le fichier de données n\'éxiste pas, faire : node caporalCli get');
        }

 */
cli
    .version('0.06')



    .command('readme', 'Lire le fichier readme')
    .action(function(args, options, logger){
       fs.readFile('README.txt', 'utf8', function (err, data) {
           if (err) throw err;
           console.log(data);
       })

    })

    // Fonction pour récupérer les données et en faire un json afin de traiter toutes les données dans un seul fichier
    .command('get', 'Récupère l\'ensemble des données et les classes dans un fichier json nommé db.json')
    .action(function (args, options, logger) {
        Parser.getData();
    })

        //Prendre les 10 tweets avec le plus de rt

    .command('topTweet', 'Top 10 des tweets comportant un hashtag et ayant été le plus retweeté')
    .option('-p --print', 'Permet d\'exporter les résultats dans un fichier export.txt', cli.BOOL, false)
    .action(function (args, options, logger) {
        if (fs.existsSync('db.json')) {
            Parser.readJSON(Parser.topTweet, options);
        } else {
            console.log('Le fichier de données n\'existe pas, faire : node caporalCli.js get');
        }
    })
    .command('nbTweetsParHashtag', 'Nombre de Tweets échangés sur une période pour un hashtag donné')
    .argument('<hashtag>', 'Le hashtag voulu')
    .argument('<date_debut>', 'Début de la période au format YYYY-MM-DD')
    .argument('<date_fin>', 'Fin de la période au format YYYY-MM-DD')
    .action(function (args, options, logger) {
        if (fs.existsSync('db.json')) {
            Parser.readJSON(Parser.numberOfTweetsByHashtag, {
                hashtags: args.hashtag,
                date_debut: args.dateDebut,
                date_fin: args.dateFin
            });
        } else {
            console.log('Le fichier de données n\'existe pas, faire : node caporalCli.js get');
        }
    })
    /*
    Tweet dans une région ou une ville
     */
    .command('region', 'Nombre de tweets par pays ou par région d\'un pays')
    .argument('<location>', 'Le nom de la region, du pays ou ville dont on souhaite connaître le nombre de tweets. Remplacer les espaces par des \'-\'')
    .argument('pays ou ville', 'Si on doit chercher un pays, une région ou une ville')
    .action(function (args, options, logger) {
        if (fs.existsSync('db.json')) {
            Parser.readJSON(Parser.byRegion, {
                location: args.location,
                critere: args.paysOuVille
            });
        } else {
            console.log('Le fichier de données n\'existe pas, faire : node caporalCli.js get');
        }
    })

    .command('hashtagRef', 'Liste des hashtags associés à un hashtag de référence')
    .argument('<hashtag>', 'Le hashtag de référence dont on souhaite chercher les autres hashtag (sans le #)')
    .option('-p --print', 'Permet d\'exporter les résultats dans un fichier export.txt', cli.BOOL, false)
    .action(function (args, options, logger) {
        if (fs.existsSync('db.json')) {
            Parser.readJSON(Parser.hashtagRef, {
                hashtag: args.hashtag,
                exportIt: options.print
            });
        } else {
            console.log('Le fichier de données n\'existe pas, faire : node caporalCli.js get');
        }
    })

    .command('topAuteur', 'Top 10 des auteurs de tweets avec le plus d’informations à leur sujet')
    .option('-p --print', 'Permet d\'exporter les résultats dans un fichier export.txt', cli.BOOL, false)
    .action(function (args, options, logger) {
        if (fs.existsSync('db.json')) {
            Parser.readJSON(Parser.topAuteur, {
                exportIt: options.print
            })
        } else {
            console.log('Le fichier de données n\'existe pas, faire : node caporalCli.js get');
        }
    })

    // Ajouté les options possible
    /*
    un auteur particulier
    contenant un hashtag
    contenant un mot dans le text
     */
    .command('filtre', 'Filtre les tweets selon différents critères de recherche')
    .argument('<element>', "Rentrez la chaine de caractères à rechercher. Vous pouvez filter par le nom de l'auteur <auteur>, par un mot dans un tweet <mot>, par un hashtag <hashtag>")
    .argument('<type>', "Selon votre filtre rentrez : auteur, mot ou hashtag" )
    .option('-c, --count', 'Compte le nombre de tweet', cli.BOOL, false)
    .option('-p --print', 'Permet d\'exporter les résultats dans un fichier export.txt', cli.BOOL, false)
    .action(function (args, options, logger) {
        if (fs.existsSync('db.json')) {
            let allArgs = ['auteur', "mot", "hashtag"];
            if (allArgs.includes(args.type)) {
                Parser.readJSON(Parser.filterTweet, {
                    count: options.count,
                    affichage: options.affichage,
                    element : args.element,
                    critere : args.type,
                    exportIt: options.print
                })
            } else {
                console.log('Le type n\'est pas correct')
            }
        } else {
            console.log('Le fichier de données n\'existe pas, faire : node caporalCli.js get');
        }
    })

	
	.command('graph', 'Construit un graphique du nombre de tweet en fonction du lieu ou de la date')
    .argument('<pays_ou_ville>', 'Si on veut le nombre de tweet en fonction de la date, du pays ou de la ville ')
	.action(function (args, options, logger) {
        if (fs.existsSync('db.json')) {
            Parser.readJSON(Parser.recupGraph, {
                critere: args.paysOuVille
            });
        } else {
            console.log('Le fichier de données n\'existe pas, faire : node caporalCli.js get');
        }
    })
	;




cli.parse(process.argv);
