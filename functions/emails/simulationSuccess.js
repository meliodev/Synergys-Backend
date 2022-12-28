function simulationSuccess() {
    return `
    <!doctype html>
    <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
	<style type="text/css">
		div#remerciement {
			float: none !important;
			width: 100% !important;
			margin-top: 100px;
		}

		.wsf-alert {
			background: none !important;
			border: none !important;
		}

		div#remerciement h2 {
			color: #fff;
			margin-bottom: 0 !important;
			padding: 10px 0;
			background: #003250;
			text-align: center;
			font-size: 34px !important;
			position: relative !important;
		}

		div#remerciement h2:after {
			border-color: #003250 transparent transparent;
			content: "";
			display: inline-block;
			position: absolute;
			bottom: -16px;
			left: calc(50% - 16px);
			width: 0;
			height: 0;
			border-style: solid;
			border-width: 18px 16px 0;
		}

		div#remerciement h3 {
			max-width: 100%;
			font-size: 20px;
			text-align: center;
		}

		#remerciement h4 {
			font-size: 24px;
			line-height: 30px !important;
			margin: 4px 0 12px;
			color: #003250;
			font-weight: bold;
		}

		span#montant-aide {
			color: #74ffa7;
			padding-left: 10px;
			font-size: 50px !important;
		}

		div#remerciement>div {
			background-size: auto 50% !important;
			background-image: url(https://groupe-synergys.fr/wp-content/themes/Avada-Child-Theme/img/maprimerenove_COMM.jpg);
			background-position: right bottom;
			background-repeat: no-repeat;
			border-radius: 8px;
			overflow: hidden;
			display: inline-block;
			width: 100%;
			box-shadow: 0px 0px 20px 5px rgb(0 0 0 / 22%);
			margin: 35px 0;
		}

		div#remerciement div.separateur {
			display: block;
			width: 48px;
			height: 4px;
			border-radius: 4px;
			margin: 22px auto;
			background: #74ffa7;
		}

		div#remerciement div.highlight {
			color: #003250;
			background: #74ffa7;
			display: block;
			padding: 6px 16px;
			border-radius: 8px;
			margin: 8px auto;
			font-size: 18px;
			text-align: center;
			max-width: fit-content;
		}

		div#remerciement .rappel {
			color: #003250;
			font-size: 13px;
			text-align: center;
		}

		#remerciement .suite {
			width: 40%;
			margin: 2%;
		}

		#remerciement .steps-list ul {
			padding: 0 !important;
		}

		#remerciement .steps-list li {
			position: relative;
			border-left: 1px solid;
			padding: 0 0 16px 24px;
			list-style: none;
			border-left-color: #d6d6d6;
		}

		#remerciement .steps-list li:before {
			position: absolute;
			left: -9px;
			top: 0;
			content: "";
			display: inline-block;
			width: 16px;
			height: 16px;
			border-radius: 16px;
			border-color: #d6d6d6;
			background-color: #fff;
			border: 1px solid;
		}

		#remerciement .steps-list li.done {
			border-left-color: #00a8a5;
		}

		#remerciement .steps-list li:last-child {
			border-left-color: transparent;
		}

		#remerciement .steps-list li.done:before,
		#remerciement .steps-list li.current:before {
			border-color: #00a8a5;
			background-color: #00a8a5;
		}

		#remerciement .steps-list .li-title {
			line-height: 1.5 !important;
			font-size: 15px;
			position: relative;
			top: -3px;
		}

		#remerciement .infos {
			padding: 0 20px !important
		}

		#remerciement div.display0 {
			display: none !important;
		}

		#remerciement .recommendations>div {
			display: flex;
			align-items: center;
			padding: 5px 0;
		}

		#remerciement .recommendations>div>div {
			width: 40px !important;
			display: inline-flex;
			align-items: center;
			justify-content: center;
		}

		#remerciement .recommendations>h4.display0 {
			display: none;
		}

		#remerciement .recommendations>h4.display1 {
			display: block !important;
		}

		.displayNePasRappeler {
			display: none !important;
		}
	</style>
</head>

<body>
	<div id="remerciement"
		class="fusion-layout-column fusion_builder_column fusion-builder-column-0 fusion_builder_column_1_1 1_1 fusion-flex-column">
		<div class="fusion-column-wrapper fusion-flex-justify-content-flex-start fusion-content-layout-column"
			style="background-position: right bottom; background-repeat: no-repeat; background-size: cover; background-color: #ffffff; padding: 0px; min-height: 0px;">
			<div class="fusion-text fusion-text-1">
				<h2 class="header-title bigger" style="--fontsize: 34; line-height: 1.5;" data-fontsize="34"
					data-lineheight="51px">Estimation de votre prime: <span id="montant-aide">10304€*</span></h2>
			</div>
			<div class="fusion-text fusion-text-2">
				<div class="infos">
					<h3 class="displayRappeler" style="--fontsize: 20; line-height: 1.5; --minfontsize: 20;"
						data-fontsize="20" data-lineheight="30px">Merci! Un conseiller peut vous contacter au <a
							href="tel:0661518679">0661518679</a></h3>
					<div class="separateur"></div>
					<div class="highlight displayRappeler">Cet appel vous permettra d'affiner votre montant d'aides et
						de connaitre les modalités.</div>
					<!--
<div class="rappel">N’oubliez pas, pour bénéficier de la prime, vous devez signer votre devis après cet appel.</div>
-->
					<div class="recommendations">
						<h4 class="display1 display0">Ce que nous vous recommandons</h4>
						<div class="display1">
							<div><img
									src="https://groupe-synergys.fr/wp-content/uploads/2021/01/climatisation-air-eau-icon-g.png">
							</div>
							<a href="https://groupe-synergys.fr/pac-air-air/" target="_blank" rel="noopener"> Pac Air
								Air</a>

						</div>
						<div class="display1">
							<div><img src="https://groupe-synergys.fr/wp-content/uploads/2021/01/air-eau-icon-g.png">
							</div>
							<a href="https://groupe-synergys.fr/pac-air-eau/" target="_blank" rel="noopener"> Pac Air
								Eau</a>

						</div>
						<div class="display1">
							<div><img
									src="https://groupe-synergys.fr/wp-content/uploads/2021/01/Thermodynamique-eau-icon-g.png">
							</div>
							<a href="https://groupe-synergys.fr/vos-solutions/chauffe-eau-thermodynamique/"
								target="_blank" rel="noopener"> Ballon Thermodynamique</a>

						</div>
						<div class="display1">
							<div><img
									src="https://groupe-synergys.fr/wp-content/uploads/2021/01/iso-combles.icon-g.png">
							</div>
							<a href="https://groupe-synergys.fr/vos-solutions/isolation-des-combles-narbonne/"
								target="_blank" rel="noopener"> Isolation des Combles</a>

						</div>
						<div class="display0">
							<div><img
									src="https://groupe-synergys.fr/wp-content/uploads/2021/01/instalation-photo-g.icon_.png">
							</div>
							<a href="https://groupe-synergys.fr/photovoltaique/" target="_blank" rel="noopener">
								Photovoltaique</a>

						</div>
					</div>
					<div class="suite">
						<div>
							<h4 class="" style="--fontsize: 24; line-height: 1.25;" data-fontsize="24"
								data-lineheight="30px">Et maintenant ?</h4>
						</div>
						<div class="steps-list">
							<ul>
								<li class="done">
									<div class="li-title">OK</div>
								</li>
								<li class="current">
									<div class="li-title">Un conseiller vous contacte par téléphone et valide votre
										dossier.</div>
								</li>
								<li>
									<div class="li-title">Synergys vous remet votre étude et votre devis .</div>
								</li>
								<li>
									<div class="li-title">Le devis accepté, nous entamons les travaux.</div>
								</li>
								<li>
									<div class="li-title">Pour les aides ? Vous n'avez pas à les avancer, Synergys est
										mandataire administratif et financier de maprimerénov'!</div>
								</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</body>

</html>
    `
}