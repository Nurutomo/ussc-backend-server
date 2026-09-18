CREATE TABLE `marker` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` tinytext NOT NULL,
  `date` datetime NOT NULL DEFAULT current_timestamp(),
  `latitude` double NOT NULL,
  `longitude` double NOT NULL,
  `photo` longtext NOT NULL,
  `photo_360` longtext NOT NULL,
  `lux` float NOT NULL DEFAULT 0,
  `done` int(11) DEFAULT NULL,
  `condition` text NOT NULL,
  `mode` text NOT NULL,
  `marker_type` varchar(32) NOT NULL DEFAULT 'pju',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci
